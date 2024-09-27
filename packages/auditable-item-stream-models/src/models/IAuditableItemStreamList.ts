// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { AuditableItemStreamTypes } from "./auditableItemStreamTypes";
import type { IAuditableItemStream } from "./IAuditableItemStream";

/**
 * Interface describing an auditable item stream list.
 */
export interface IAuditableItemStreamList {
	/**
	 * JSON-LD Context.
	 */
	"@context":
		| typeof AuditableItemStreamTypes.ContextRoot
		| [typeof AuditableItemStreamTypes.ContextRoot, ...string[]];

	/**
	 * JSON-LD Type.
	 */
	type: typeof AuditableItemStreamTypes.StreamList;

	/**
	 * The streams.
	 */
	streams: IAuditableItemStream[];

	/**
	 * Cursor for the next chunk of streams.
	 */
	cursor?: string;
}
