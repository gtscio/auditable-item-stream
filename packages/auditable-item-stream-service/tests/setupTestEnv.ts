// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import path from "node:path";
import type {
	IAuditableItemStreamCredential,
	IAuditableItemStreamEntryCredential
} from "@twin.org/auditable-item-stream-models";
import { Converter, Is, ObjectHelper, RandomHelper } from "@twin.org/core";
import { Bip39 } from "@twin.org/crypto";
import type { IJsonLdNodeObject } from "@twin.org/data-json-ld";
import { MemoryEntityStorageConnector } from "@twin.org/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@twin.org/entity-storage-models";
import {
	EntityStorageIdentityConnector,
	type IdentityDocument,
	initSchema as initSchemaIdentity
} from "@twin.org/identity-connector-entity-storage";
import { IdentityConnectorFactory } from "@twin.org/identity-models";
import { nameof } from "@twin.org/nameof";
import type { IDidVerifiableCredential } from "@twin.org/standards-w3c-did";
import {
	EntityStorageVaultConnector,
	type VaultKey,
	type VaultSecret,
	initSchema as initSchemaVault
} from "@twin.org/vault-connector-entity-storage";
import { VaultConnectorFactory, VaultKeyType } from "@twin.org/vault-models";
import { type IJwtHeader, type IJwtPayload, Jwt } from "@twin.org/web";
import * as dotenv from "dotenv";

console.debug("Setting up test environment from .env and .env.dev files");

dotenv.config({ path: [path.join(__dirname, ".env"), path.join(__dirname, ".env.dev")] });

initSchemaVault();
initSchemaIdentity();

const keyEntityStorage = new MemoryEntityStorageConnector<VaultKey>({
	entitySchema: nameof<VaultKey>()
});
EntityStorageConnectorFactory.register("vault-key", () => keyEntityStorage);
const secretEntityStorage = new MemoryEntityStorageConnector<VaultSecret>({
	entitySchema: nameof<VaultSecret>()
});
EntityStorageConnectorFactory.register("vault-secret", () => secretEntityStorage);

export const TEST_VAULT_CONNECTOR = new EntityStorageVaultConnector();
VaultConnectorFactory.register("vault", () => TEST_VAULT_CONNECTOR);

const identityEntityStorage = new MemoryEntityStorageConnector<IdentityDocument>({
	entitySchema: nameof<IdentityDocument>()
});
EntityStorageConnectorFactory.register("identity-document", () => identityEntityStorage);

export const TEST_IDENTITY_CONNECTOR = new EntityStorageIdentityConnector();
IdentityConnectorFactory.register("identity", () => TEST_IDENTITY_CONNECTOR);

export let TEST_NODE_IDENTITY: string;
export let TEST_USER_IDENTITY: string;
export let TEST_VAULT_KEY: string;

/**
 * Setup the test environment.
 */
export async function setupTestEnv(): Promise<void> {
	RandomHelper.generate = vi
		.fn()
		.mockImplementationOnce(length => new Uint8Array(length).fill(99))
		.mockImplementation(length => new Uint8Array(length).fill(88));
	Bip39.randomMnemonic = vi
		.fn()
		.mockImplementation(
			() =>
				"elder blur tip exact organ pipe other same minute grace conduct father brother prosper tide icon pony suggest joy provide dignity domain nominee liquid"
		);

	const didNode = await TEST_IDENTITY_CONNECTOR.createDocument("test-node-identity");
	await TEST_IDENTITY_CONNECTOR.addVerificationMethod(
		"test-node-identity",
		didNode.id,
		"assertionMethod",
		"auditable-item-stream"
	);
	const didUser = await TEST_IDENTITY_CONNECTOR.createDocument("test-node-identity");

	TEST_NODE_IDENTITY = didNode.id;
	TEST_USER_IDENTITY = didUser.id;
	TEST_VAULT_KEY = `${TEST_NODE_IDENTITY}/auditable-item-stream`;

	await TEST_VAULT_CONNECTOR.addKey(
		TEST_VAULT_KEY,
		VaultKeyType.Ed25519,
		Converter.base64ToBytes("p519gRazpBYvzqviRrFRBUT+ZNRZ24FYgOLcGO+Nj4Q="),
		Converter.base64ToBytes("DzFGb9pwkyom+MGrKeVCAV2CMEiy04z9bJLj48XGjWw=")
	);
}

/**
 * Decode the JWT to get the integrity data.
 * @param immutableStore The immutable store to decode.
 * @returns The integrity data.
 */
export async function decodeJwtToIntegrity(immutableStore: string): Promise<{
	created: number;
	userIdentity: string;
	hash: string;
	signature: string;
	index?: number;
}> {
	const vcJwt = Converter.bytesToUtf8(Converter.base64ToBytes(immutableStore));
	const decodedJwt = await Jwt.decode<
		IJwtHeader,
		IJwtPayload & {
			vc: IDidVerifiableCredential<
				(IAuditableItemStreamCredential | IAuditableItemStreamEntryCredential) & IJsonLdNodeObject
			>;
		}
	>(vcJwt);
	const credentialData = Is.arrayValue(decodedJwt.payload?.vc?.credentialSubject)
		? decodedJwt.payload?.vc?.credentialSubject[0]
		: (decodedJwt.payload?.vc?.credentialSubject ?? {
				created: 0,
				userIdentity: "",
				hash: "",
				signature: "",
				index: 0
			});

	return {
		created: credentialData.created,
		userIdentity: credentialData.userIdentity,
		hash: credentialData.hash,
		signature: credentialData.signature,
		index: ObjectHelper.propertyGet(credentialData, "index")
	};
}
