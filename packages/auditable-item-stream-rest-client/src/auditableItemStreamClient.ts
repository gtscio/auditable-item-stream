// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { BaseRestClient } from "@gtsc/api-core";
import type { IBaseRestClientConfig, ICreatedResponse, INoContentResponse } from "@gtsc/api-models";
import type {
	IAuditableItemStream,
	IAuditableItemStreamComponent,
	IAuditableItemStreamCreateEntryRequest,
	IAuditableItemStreamCreateRequest,
	IAuditableItemStreamEntry,
	IAuditableItemStreamGetEntryRequest,
	IAuditableItemStreamGetEntryResponse,
	IAuditableItemStreamGetRequest,
	IAuditableItemStreamGetResponse,
	IAuditableItemStreamListEntriesRequest,
	IAuditableItemStreamListEntriesResponse,
	IAuditableItemStreamListRequest,
	IAuditableItemStreamListResponse,
	IAuditableItemStreamUpdateEntryRequest,
	IAuditableItemStreamUpdateRequest,
	JsonReturnType
} from "@gtsc/auditable-item-stream-models";
import { Guards, Is } from "@gtsc/core";
import type { IJsonLdDocument, IJsonLdNodeObject } from "@gtsc/data-json-ld";
import type { IComparator, SortDirection } from "@gtsc/entity";
import { nameof } from "@gtsc/nameof";
import { MimeTypes } from "@gtsc/web";

/**
 * Client for performing auditable item stream through to REST endpoints.
 */
export class AuditableItemStreamClient
	extends BaseRestClient
	implements IAuditableItemStreamComponent
{
	/**
	 * Runtime name for the class.
	 */
	public readonly CLASS_NAME: string = nameof<AuditableItemStreamClient>();

	/**
	 * Create a new instance of AuditableItemStreamClient.
	 * @param config The configuration for the client.
	 */
	constructor(config: IBaseRestClientConfig) {
		super(nameof<AuditableItemStreamClient>(), config, "auditable-item-stream");
	}

	/**
	 * Create a new stream.
	 * @param metadata The metadata for the stream as JSON-LD.
	 * @param entries Entries to store in the stream.
	 * @param options Options for creating the stream.
	 * @param options.immutableInterval After how many entries do we add immutable checks, defaults to service configured value.
	 * A value of 0 will disable immutable checks, 1 will be every item, or <n> for an interval.
	 * @returns The id of the new stream item.
	 */
	public async create(
		metadata?: IJsonLdNodeObject,
		entries?: {
			metadata?: IJsonLdNodeObject;
		}[],
		options?: {
			immutableInterval?: number;
		}
	): Promise<string> {
		const response = await this.fetch<IAuditableItemStreamCreateRequest, ICreatedResponse>(
			"/",
			"POST",
			{
				body: {
					metadata,
					entries,
					immutableInterval: options?.immutableInterval
				}
			}
		);

		return response.headers.Location;
	}

	/**
	 * Get a stream header without the entries.
	 * @param id The id of the stream to get.
	 * @param options Additional options for the get operation.
	 * @param options.includeEntries Whether to include the entries, defaults to false.
	 * @param options.includeDeleted Whether to include deleted entries, defaults to false.
	 * @param responseType The response type to return, defaults to application/json.
	 * @returns The stream and entries if found.
	 * @throws NotFoundError if the stream is not found
	 */
	public async get<T extends "json" | "jsonld" = "json">(
		id: string,
		options?: {
			includeEntries?: boolean;
			includeDeleted?: boolean;
		},
		responseType?: T
	): Promise<
		JsonReturnType<T, IAuditableItemStream, IJsonLdDocument> & {
			cursor?: string;
		}
	> {
		Guards.stringValue(this.CLASS_NAME, nameof(id), id);

		const response = await this.fetch<
			IAuditableItemStreamGetRequest,
			IAuditableItemStreamGetResponse
		>("/:id", "GET", {
			headers: {
				Accept: responseType === "json" ? MimeTypes.Json : MimeTypes.JsonLd
			},
			pathParams: {
				id
			},
			query: options
		});

		return response.body as JsonReturnType<T, IAuditableItemStream, IJsonLdDocument> & {
			cursor?: string;
		};
	}

	/**
	 * Update a stream.
	 * @param id The id of the stream to update.
	 * @param metadata The metadata for the stream as JSON-LD.
	 * @returns Nothing.
	 */
	public async update(id: string, metadata?: IJsonLdNodeObject): Promise<void> {
		Guards.stringValue(this.CLASS_NAME, nameof(id), id);

		await this.fetch<IAuditableItemStreamUpdateRequest, INoContentResponse>("/:id", "PUT", {
			pathParams: {
				id
			},
			body: {
				metadata
			}
		});
	}

	/**
	 * Query all the streams, will not return entries.
	 * @param conditions Conditions to use in the query.
	 * @param orderBy The order for the results, defaults to created.
	 * @param orderByDirection The direction for the order, defaults to descending.
	 * @param properties The properties to return, if not provided defaults to id, created and metadata.
	 * @param cursor The cursor to request the next page of entities.
	 * @param pageSize The maximum number of entities in a page.
	 * @param responseType The response type to return, defaults to application/json.
	 * @returns The entities, which can be partial if a limited keys list was provided.
	 */
	public async query<T extends "json" | "jsonld" = "json">(
		conditions?: IComparator[],
		orderBy?: "created" | "updated",
		orderByDirection?: SortDirection,
		properties?: (keyof IAuditableItemStream)[],
		cursor?: string,
		pageSize?: number,
		responseType?: T
	): Promise<{
		/**
		 * The entities, which can be partial if a limited keys list was provided.
		 */
		entities: JsonReturnType<
			T,
			Partial<Omit<IAuditableItemStream, "entries">>[],
			IJsonLdDocument[]
		>;
		/**
		 * An optional cursor, when defined can be used to call find to get more entities.
		 */
		cursor?: string;
	}> {
		const response = await this.fetch<
			IAuditableItemStreamListRequest,
			IAuditableItemStreamListResponse
		>("/", "GET", {
			headers: {
				Accept: responseType === "json" ? MimeTypes.Json : MimeTypes.JsonLd
			},
			query: {
				conditions: this.convertConditionsQueryString(conditions),
				orderBy,
				orderByDirection,
				properties: properties?.join(","),
				cursor,
				pageSize
			}
		});

		return response.body as {
			/**
			 * The entities, which can be partial if a limited keys list was provided.
			 */
			entities: JsonReturnType<
				T,
				Partial<Omit<IAuditableItemStream, "entries">>[],
				IJsonLdDocument[]
			>;
			/**
			 * An optional cursor, when defined can be used to call find to get more entities.
			 */
			cursor?: string;
		};
	}

	/**
	 * Create an entry in the stream.
	 * @param id The id of the stream to update.
	 * @param entryMetadata The metadata for the stream as JSON-LD.
	 * @returns The id of the created entry, if not provided.
	 */
	public async createEntry(id: string, entryMetadata?: IJsonLdNodeObject): Promise<string> {
		Guards.stringValue(this.CLASS_NAME, nameof(id), id);

		const response = await this.fetch<IAuditableItemStreamCreateEntryRequest, ICreatedResponse>(
			"/:id",
			"POST",
			{
				pathParams: {
					id
				},
				body: {
					metadata: entryMetadata
				}
			}
		);

		return response.headers.Location;
	}

	/**
	 * Get the entry from the stream.
	 * @param id The id of the stream to get.
	 * @param entryId The id of the stream entry to get.
	 * @param responseType The response type to return, defaults to application/json.
	 * @returns The stream and entries if found.
	 * @throws NotFoundError if the stream is not found.
	 */
	public async getEntry<T extends "json" | "jsonld" = "json">(
		id: string,
		entryId: string,
		responseType?: T
	): Promise<JsonReturnType<T, IAuditableItemStreamEntry, IJsonLdDocument>> {
		Guards.stringValue(this.CLASS_NAME, nameof(id), id);
		Guards.stringValue(this.CLASS_NAME, nameof(entryId), entryId);

		const response = await this.fetch<
			IAuditableItemStreamGetEntryRequest,
			IAuditableItemStreamGetEntryResponse
		>("/:id/:entryId", "GET", {
			headers: {
				Accept: responseType === "json" ? MimeTypes.Json : MimeTypes.JsonLd
			},
			pathParams: {
				id,
				entryId
			}
		});

		return response.body as JsonReturnType<T, IAuditableItemStreamEntry, IJsonLdDocument>;
	}

	/**
	 * Update an entry in the stream.
	 * @param id The id of the stream to update.
	 * @param entryId The id of the entry to update.
	 * @param entryMetadata The metadata for the entry as JSON-LD.
	 * @returns Nothing.
	 */
	public async updateEntry(
		id: string,
		entryId: string,
		entryMetadata?: IJsonLdNodeObject
	): Promise<void> {
		Guards.stringValue(this.CLASS_NAME, nameof(id), id);
		Guards.stringValue(this.CLASS_NAME, nameof(entryId), entryId);

		await this.fetch<IAuditableItemStreamUpdateEntryRequest, INoContentResponse>(
			"/:id/:entryId",
			"PUT",
			{
				pathParams: {
					id,
					entryId
				},
				body: {
					metadata: entryMetadata
				}
			}
		);
	}

	/**
	 * Delete from the stream.
	 * @param id The id of the stream to update.
	 * @param entryId The id of the entry to delete.
	 * @returns Nothing.
	 */
	public async removeEntry(id: string, entryId: string): Promise<void> {
		Guards.stringValue(this.CLASS_NAME, nameof(id), id);
		Guards.stringValue(this.CLASS_NAME, nameof(entryId), entryId);

		await this.fetch<IAuditableItemStreamUpdateEntryRequest, INoContentResponse>(
			"/:id/:entryId",
			"DELETE",
			{
				pathParams: {
					id,
					entryId
				}
			}
		);
	}

	/**
	 * Get the entries for the stream.
	 * @param id The id of the stream to get.
	 * @param options Additional options for the get operation.
	 * @param options.conditions The conditions to filter the stream.
	 * @param options.includeDeleted Whether to include deleted entries, defaults to false.
	 * @param options.pageSize How many entries to return.
	 * @param options.cursor Cursor to use for next chunk of data.
	 * @param options.order Retrieve the entries in ascending/descending time order, defaults to Ascending.
	 * @param responseType The response type to return, defaults to application/json.
	 * @returns The stream and entries if found.
	 * @throws NotFoundError if the stream is not found.
	 */
	public async getEntries<T extends "json" | "jsonld" = "json">(
		id: string,
		options?: {
			conditions?: IComparator[];
			includeDeleted?: boolean;
			pageSize?: number;
			cursor?: string;
			order?: SortDirection;
		},
		responseType?: T
	): Promise<{
		entries: JsonReturnType<T, IAuditableItemStreamEntry[], IJsonLdDocument[]>;
		cursor?: string;
	}> {
		Guards.stringValue(this.CLASS_NAME, nameof(id), id);

		const response = await this.fetch<
			IAuditableItemStreamListEntriesRequest,
			IAuditableItemStreamListEntriesResponse
		>("/:id/:entryId", "GET", {
			headers: {
				Accept: responseType === "json" ? MimeTypes.Json : MimeTypes.JsonLd
			},
			pathParams: {
				id
			},
			query: {
				conditions: this.convertConditionsQueryString(options?.conditions),
				includeDeleted: options?.includeDeleted,
				pageSize: options?.pageSize,
				cursor: options?.cursor,
				order: options?.order
			}
		});

		return response.body as {
			entries: JsonReturnType<T, IAuditableItemStreamEntry[], IJsonLdDocument[]>;
			cursor?: string;
		};
	}

	/**
	 * Convert the conditions query string to a list of comparators.
	 * @param conditions The conditions query string.
	 * @returns The list of comparators.
	 * @internal
	 */
	private convertConditionsQueryString(conditions?: IComparator[]): string | undefined {
		if (Is.arrayValue(conditions)) {
			const conditionsList: string[] = [];
			for (const conditionPart of conditions) {
				conditionsList.push(
					`${conditionPart.property}|${conditionPart.comparison}|${conditionPart.value}`
				);
			}
			return conditionsList.join(",");
		}
	}
}
