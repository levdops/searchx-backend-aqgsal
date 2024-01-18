'use strict'

exports.index = process.env.ES_INDEX || 'NONE' 
exports.queryField = 'page_name'
const queryFields =  ['paragraphs.content', "page_name", "paragraphs.heading"];

exports.custom_query = function(user_query){
    return {
        query: {
            nested:{
                path:"paragraphs",
                query: {
                    multi_match: {
                        query: user_query,
                        fields: queryFields,
                        }
                    }
                }
            },
            highlight:{
                fragment_size: 200,
                fields: [{title: {}},{paperAbstract:{}}]
            }
        }
    }

exports.formatHit = function (hit) {
    const source = hit._source;
    // const title = source.title ? source.title.replace(/\s+/g, " ") : "";
    // const snippet = hit.highlight['paperAbstract'].join("(...) ").replace(/\s+/g, " ").substr(0, 300);
    var paragraphs = source['paragraphs']

    return {
        id: hit._id,
        name: source['page_name'],
        url: source['page_id'],
        paragraphs: paragraphs,
        // source: source[''],
        // venue: source['venue'] + " " +  source["year"],
        // snippet: snippet
    };
};
