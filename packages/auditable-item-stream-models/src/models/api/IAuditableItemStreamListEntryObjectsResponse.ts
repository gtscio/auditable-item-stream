// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { HeaderTypes, MimeTypes } from "@twin.org/web";
import type { IAuditableItemStreamEntryObjectList } from "../IAuditableItemStreamEntryObjectList";

/**
 * Response to getting an auditable item stream entries objects.
 */
export interface IAuditableItemStreamListEntryObjectsResponse {
	/**
	 * The headers which can be used to determine the response data type.
	 */
	headers?: {
		[HeaderTypes.ContentType]: typeof MimeTypes.Json | typeof MimeTypes.JsonLd;
	};

	/**
	 * The response body.
	 */
	body: IAuditableItemStreamEntryObjectList;
}
