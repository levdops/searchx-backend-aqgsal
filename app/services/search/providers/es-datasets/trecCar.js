'use strict'

exports.index = process.env.ES_INDEX || 'NONE' 
exports.queryField = 'content'
// const queryFields =  ['paragraphs.content', "page_name", "paragraphs.heading"];
//const queryFields = ["content", "page_name", "heading"];
const queryFields = ["content"];

exports.custom_query = function(user_query){
    return {

        query: {
                multi_match: {
                    query: user_query,
                    fields: queryFields,
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
	console.log(source.title);
	console.log("---***---")

    return {
        id: hit._id,
        url: hit._id,
        heading: source.heading,
        subheading: source.sub_heading,
        name: source.page_name,
        page_id: source.page_id,
        content: source.content,
        title: source.title,
        QA: source.qas,
    };
};
