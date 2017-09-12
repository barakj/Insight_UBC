/**
 * Created by Owner on 10/21/2016.
 */
/*
 * This should be in the same folder as your controllers
 */
import {QueryRequest} from "./QueryController";

export interface InsightResponse {
    code: number;
    body: {}; // this is what you would return to a requestee in the REST body
}

export interface IInsightFacade {

    /**
     * Add a dataset to UBCInsight.
     *
     * @param id  The id of the dataset being added. This is the same as the PUT id.
     * @param content  The base64 content of the dataset. This is the same as the PUT body.
     *
     * The promise should return an InsightResponse for both fullfill and reject.
     * fulfill should be for 2XX codes and reject for everything else.
     */
    addDataset(id: string, content: string): Promise<InsightResponse>;

    /**
     * Remove a dataset from UBCInsight.
     *
     * @param id  The id of the dataset to remove. This is the same as the DELETE id.
     *
     * The promise should return an InsightResponse for both fullfill and reject.
     * fulfill should be for 2XX codes and reject for everything else.
     */
    removeDataset(id: string): Promise<InsightResponse>;

    /**
     * Perform a query on UBCInsight.
     *
     * @param query  The query to be performed. This is the same as the body of the POST message.
     * @return Promise <InsightResponse>
     * The promise should return an InsightResponse for both fullfill and reject.
     * fulfill should be for 2XX codes and reject for everything else.
     */
    performQuery(query: QueryRequest): Promise<InsightResponse>;
}