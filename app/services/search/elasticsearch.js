'use strict';

const elasticsearchApi = require('elasticsearch');
const esClient = new elasticsearchApi.Client({
    host: process.env.ELASTIC_SEARCH,
    log: 'error'
});

var text_vertical ;
const clueweb       = require('./es-datasets/clueweb');
const cranfield     = require('./es-datasets/cranfield');
const customIndex   = require('./es-datasets/semanticScholar');
const treccarIndex  = require('./es-datasets/trecCar');

if (process.env.ES_INDEX == 'trec_car'){
    text_vertical = treccarIndex;
}
else if(process.env.ES_INDEX){
    text_vertical = customIndex;
} else {
    text_vertical = cranfield;
}
// mapping of vertical to module for elasticsearch dataset
const verticals = {
    text: text_vertical,
};

/**
 * Fetch data from elasticsearch and return formatted results.
 */
exports.fetch = function (query, vertical, pageNumber, resultsPerPage, relevanceFeedbackDocuments) {
    if (Array.isArray(relevanceFeedbackDocuments) && relevanceFeedbackDocuments.length > 0) {
        return Promise.reject({name: 'Bad Request', message: 'The Elasticsearch search provider does not support relevance feedback, but got relevance feedback documents.'})
    }
    if (vertical in verticals) {
        const dataset = verticals[vertical];
        if (process.env.ES_INDEX) {
            return esClient.search({
                index: dataset.index,
                from: (pageNumber - 1) * resultsPerPage,
                size: resultsPerPage,
                body: dataset.custom_query(query),
                pretty: true
            }).then(formatResults(vertical));
        }
        return esClient.search({
            index: dataset.index,
            // type: 'document',
            from: (pageNumber - 1) * resultsPerPage,
            size: resultsPerPage,
            body: {
                query: {
                    match: {
                        [dataset.queryField]: query
                    }
                }
            }
        }).then(formatResults(vertical));
    } else return Promise.reject({
        name: 'Bad Request',
        message: 'Invalid vertical. Valid verticals are %s ', verticals
    });
};

/**
 * Format the results returned by elasticsearch, using the dataset corresponding to the requested vertical.
 */
function formatResults(vertical) {
    return function (result) {
        const dataset = verticals[vertical];
        if (!result.hits || result.hits.length === 0) {
            throw new Error('No results from search api.');
        }
        let results = [];
        result.hits.hits.forEach(function (hit) {
            results.push(dataset.formatHit(hit));
        });

        return {
            results: results,
            matches: result.hits.total
        };
    }
}
