/// <reference path="./.sst/platform/config.d.ts" />

import { join } from "node:path";

export default $config({
	app(input) {
		return {
			name: "zchat-svelte",
			removal: input?.stage === "production" ? "retain" : "remove",
			home: "aws",
			region: process.env.AWS_REGION || "eu-central-1",
			providers: { cloudflare: "5.49.1", command: "1.0.2" },
		};
	},
	async run() {
		const zeroVersion = process.env.ZERO_VERSION || "0.16.2025022800";

		// S3 Bucket
		const replicationBucket = new sst.aws.Bucket("replication-bucket");

		// VPC Configuration
		const vpc = new sst.aws.Vpc("vpc", {
			az: 2,
			nat: "ec2",
		});

		// ECS Cluster
		const cluster = new sst.aws.Cluster("cluster", {
			vpc,
		});

		// Common environment variables
		const commonEnv = {
			ZERO_UPSTREAM_DB: process.env.ZERO_UPSTREAM_DB ?? "",
			ZERO_CVR_DB: process.env.ZERO_CVR_DB ?? "",
			ZERO_CHANGE_DB: process.env.ZERO_CHANGE_DB ?? "",
			ZERO_REPLICA_FILE: "sync-replica.db",
			ZERO_LITESTREAM_BACKUP_URL: $interpolate`s3://${replicationBucket.name}/backup`,
			ZERO_IMAGE_URL: `rocicorp/zero:${zeroVersion}`,
			ZERO_CVR_MAX_CONNS: "10",
			ZERO_UPSTREAM_MAX_CONNS: "10",
		};

		const backendEnv = {
			BETTER_AUTH_URL: `https://${process.env.BACKEND_DOMAIN}`,
			BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? "",
			GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID ?? "",
			GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET ?? "",
			OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ?? "",
			AI_MODEL_NAME: process.env.AI_MODEL_NAME ?? "",
			PUBLIC_FRONTEND_URL: `https://${process.env.FRONTEND_DOMAIN}`,
		};

		// Auth Backend
		const authBackend = new sst.aws.Service("auth-backend", {
			cluster,
			image: {
				context: ".",
				dockerfile: "./Dockerfile.api",
			},
			health: {
				command: [
					"CMD-SHELL",
					"wget -nv -t1 --spider http://localhost:3000/health || exit 1",
				],
				interval: "5 seconds",
				retries: 3,
				startPeriod: "300 seconds",
			},
			loadBalancer: {
				public: true,
				domain: {
					name: process.env.BACKEND_DOMAIN ?? "",
					dns: sst.cloudflare.dns({
						proxy: true,
					}),
				},
				ports: [
					{ listen: "80/http", forward: "3000/http" },
					{ listen: "443/https", forward: "3000/http" },
				],
			},
			environment: {
				...backendEnv,
				DATABASE_URL: commonEnv.ZERO_UPSTREAM_DB,
			},
		});

		// Replication Manager Service
		const replicationManager = new sst.aws.Service("replication-manager", {
			cluster,
			cpu: "2 vCPU",
			memory: "4 GB",
			image: commonEnv.ZERO_IMAGE_URL,
			link: [replicationBucket],
			health: {
				command: ["CMD-SHELL", "curl -f http://localhost:4849/ || exit 1"],
				interval: "5 seconds",
				retries: 3,
				startPeriod: "300 seconds",
			},
			environment: {
				...commonEnv,
				ZERO_AUTH_JWKS_URL: $interpolate`${authBackend.url}api/auth/jwks`,
				ZERO_CHANGE_MAX_CONNS: "3",
				ZERO_NUM_SYNC_WORKERS: "0",
			},
			loadBalancer: {
				public: false,
				ports: [
					{
						listen: "80/http",
						forward: "4849/http",
					},
				],
			},
			transform: {
				loadBalancer: {
					idleTimeout: 3600,
				},
				target: {
					healthCheck: {
						enabled: true,
						path: "/keepalive",
						protocol: "HTTP",
						interval: 5,
						healthyThreshold: 2,
						timeout: 3,
					},
				},
			},
		});

		// View Syncer Service
		const viewSyncer = new sst.aws.Service("view-syncer", {
			cluster,
			cpu: "2 vCPU",
			memory: "4 GB",
			image: commonEnv.ZERO_IMAGE_URL,
			link: [replicationBucket],
			health: {
				command: ["CMD-SHELL", "curl -f http://localhost:4848/ || exit 1"],
				interval: "5 seconds",
				retries: 3,
				startPeriod: "300 seconds",
			},
			environment: {
				...commonEnv,
				ZERO_AUTH_JWKS_URL: $interpolate`${authBackend.url}api/auth/jwks`,
				ZERO_CHANGE_STREAMER_URI: replicationManager.url,
			},
			logging: {
				retention: "1 month",
			},
			loadBalancer: {
				public: true,
				domain: {
					name: process.env.ZERO_DOMAIN ?? "",
					dns: sst.cloudflare.dns({
						proxy: true,
					}),
				},
				rules: [
					{ listen: "80/http", forward: "4848/http" },
					{ listen: "443/https", forward: "4848/http" },
				],
			},
			transform: {
				target: {
					healthCheck: {
						enabled: true,
						path: "/keepalive",
						protocol: "HTTP",
						interval: 5,
						healthyThreshold: 2,
						timeout: 3,
					},
					stickiness: {
						enabled: true,
						type: "lb_cookie",
						cookieDuration: 120,
					},
					loadBalancingAlgorithmType: "least_outstanding_requests",
				},
			},
		});

		// Permissions deployment
		new command.local.Command(
			"zero-deploy-permissions",
			{
				// Pulumi operates with cwd at the package root.
				dir: join(process.cwd(), "."),
				create:
					"npx zero-deploy-permissions --schema-path ./web/src/lib/db/zero-schema.ts",
				environment: { ZERO_UPSTREAM_DB: commonEnv.ZERO_UPSTREAM_DB },
				// Run the Command on every deploy.
				triggers: [Date.now()],
			},
			// after the view-syncer is deployed.
			{ dependsOn: viewSyncer },
		);

		// Frontend app
		new sst.aws.StaticSite("web-frontend", {
			domain: {
				name: process.env.FRONTEND_DOMAIN ?? "",
				dns: sst.cloudflare.dns({
					proxy: false, // somehow can't be proxied
				}),
			},
			build: {
				command: "bun run build",
				output: "build",
			},
			path: "web",
			environment: {
				PUBLIC_ZERO_SERVER: viewSyncer.url,
				PUBLIC_BACKEND_URL: authBackend.url,
			},
		});
	},
});
