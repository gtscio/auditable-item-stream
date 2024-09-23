// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { SortDirection } from "@twin.org/entity";
import type { MimeTypes } from "@twin.org/web";

/**
 * Get an auditable item stream entry objects.
 */
export interface IAuditableItemStreamListEntryObjectsRequest {
	/**
	 * The headers which can be used to determine the response data type.
	 */
	headers?: {
		Accept: typeof MimeTypes.Json | typeof MimeTypes.JsonLd;
	};

	/**
	 * The parameters from the path.
	 */
	pathParams: {
		/**
		 * The id of the stream to get.
		 */
		id: string;
	};

	/**
	 * The query parameters.
	 */
	query?: {
		/**
		 * The conditions to filter the stream, consist of property|comparison|value comma separated.
		 */
		conditions?: string;

		/**
		 * Whether to include deleted entries, defaults to false.
		 */
		includeDeleted?: boolean;

		/**
		 * Retrieve the entries in ascending/descending time order, defaults to Ascending.
		 */
		order?: SortDirection;

		/**
		 * How many entries to return.
		 */
		pageSize?: number;

		/**
		 * Cursor to use for next chunk of data.
		 */
		cursor?: string;
	};
}
