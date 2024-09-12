// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { EntitySchemaFactory, EntitySchemaHelper } from "@gtsc/entity";
import { nameof } from "@gtsc/nameof";
import { AuditableItemStream } from "./entities/auditableItemStream";
import { AuditableItemStreamEntry } from "./entities/auditableItemStreamEntry";

/**
 * Initialize the schema for the auditable item stream entity storage connector.
 */
export function initSchema(): void {
	EntitySchemaFactory.register(nameof<AuditableItemStream>(), () =>
		EntitySchemaHelper.getSchema(AuditableItemStream)
	);
	EntitySchemaFactory.register(nameof<AuditableItemStreamEntry>(), () =>
		EntitySchemaHelper.getSchema(AuditableItemStreamEntry)
	);
}
