from elasticsearch import Elasticsearch  
from elasticsearch.helpers import bulk, streaming_bulk 
import json, os, sys
import tqdm
es_client = Elasticsearch([{'host': 'localhost', 'port': '9200'}])


confusion_subsection_ds = [json.loads(_) for _ in open("./data/trec-car.qa.with_confusion.jsonl")]


def make_ns_es_paragraph_index_snippets(es_client, data_items, index_name="trec_car", re_index=True):
    if re_index and es_client.indices.exists(index_name):
        es_client.indices.delete(index_name)

    index_config = {
        "settings": {
            "number_of_shards": 1,
            "analysis": {
                "analyzer": {
                    "default": {
                        "tokenizer": "standard",
                        "filter": [ "stop" , "lowercase"]
                        }
                    }
                },

        },
        "mappings": {
            "properties": {
                "page_id": {"type": "text", "index":False}, #, "similarity": "BM25"},
                "heading": {
                    "type": "text", "index":True, "similarity": "BM25"
                },
                "sub_heading": {
                    "type": "text", "index":True, "similarity": "BM25"
                },
                "title": {
                    "type": "text", "index":False
                },

                "content": {
                    "type": "text", "index":True, "similarity": "BM25"
                },
                "qas":{
                    "type": "nested", 
                    "properties":{
                        'answer':{
                            "type": "text",
                            "index": False,
                        },
                        "question":{
                            "type": "text",
                            "index": False,                                    
                        },
                    }
                }
            }
        },
    }
    # es_client.indices.create(index=index_name, body=index_config, )
    if not es_client.indices.exists(index_name):
        es_client.indices.create(index=index_name, body=index_config,)
    number_of_docs = len(data_items)
    progress = tqdm.tqdm(unit="docs", total=number_of_docs)
    successes = 0

    def passage_generator():
        for passage in data_items:
            yield passage

    # create the ES index
    for ok, action in streaming_bulk(
        client=es_client,
        index=index_name,
        actions=passage_generator(),
    ):
        progress.update(1)
        successes += ok
    print("Indexed %d documents" % (successes,))

make_ns_es_paragraph_index_snippets(es_client, confusion_subsection_ds) #new_subsection_ds)

def query_es_index(question, es_client, index_name="trec_car", n_results=10,):
    q = question.lower()
    
    response = es_client.search(
        index=index_name,
        body={
            "query": {
                "multi_match": {
                    "query": q,
                    "fields": ["content"], #, "page_name", "heading"],
                    # "type": "cross_fields",
                }
            },
            "size": n_results,
        },
    )
    
    return response


results = query_es_index("United Kingdom television".lower(), es_client)

print(results['hits'])
