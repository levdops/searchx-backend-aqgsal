## Setup Mongodb, redis, etc.

```
sudo apt install build-essential 
```
- install redis
```
sudo snap install redis

```

- install mongodb
	Ref: https://www.mongodb.com/docs/v6.0/tutorial/install-mongodb-on-ubuntu/
```
curl -fsSL https://pgp.mongodb.com/server-6.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor
```

```
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
```

```
sudo apt-get update
sudo apt-get install -y mongodb-org=6.0.10 mongodb-org-database=6.0.10 mongodb-org-server=6.0.10 mongodb-org-mongos=6.0.10 mongodb-org-tools=6.0.10
echo "mongodb-org hold" | sudo dpkg --set-selections
echo "mongodb-org-database hold" | sudo dpkg --set-selections
echo "mongodb-org-server hold" | sudo dpkg --set-selections
echo "mongodb-mongosh hold" | sudo dpkg --set-selections
echo "mongodb-org-mongos hold" | sudo dpkg --set-selections
echo "mongodb-org-tools hold" | sudo dpkg --set-selections
```

Choose the init system based on the output of the following command:
```
ps --no-headers -o comm 1
sudo systemctl start mongod
sudo systemctl status mongod
sudo systemctl enable mongod
```

### download elasticsearch:
```
wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-7.7.1-linux-x86_64.tar.gz

tar -xzvf elasticsearch-7.7.1-linux-x86_64.tar.gz
```
- [Run elasticsearch service](https://www.elastic.co/guide/en/elasticsearch/reference/7.17/starting-elasticsearch.html): 
```
- cd elasticsearch-7.7.1
- ./bin/elasticsearch -d -p pid
- pip uninstall elasticsearch
- pip install elasticsearch==7.7.1
- cd ..
```

- Make elasticsearch index
```
python make_elastic_index.py
```

### Setup Back-end

- install nvm: 
```
curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash
source ~/.bashrc
```
- use node 12.1.0:
```
- nvm install 12.1.0
- nvm use 12.1.0
```
	

```
git clone https://github.com/zpeide/searchx-backend-aqgsal.git
npm install .
```


- Test backend
```
curl -X GET "localhost:8080/v1/search/text/?query=test&page=1&providerName=elasticsearch"
```

- Use the following .env config
```
NODE_ENV=development
PORT=8080
#4443
DB=mongodb://localhost/searchx-pilot-app-1
REDIS=redis://localhost:6379
DEFAULT_SEARCH_PROVIDER=elasticsearch
ELASTIC_SEARCH=localhost:9200
ES_INDEX=trec_car
```

### Setup Front-end

```
git clone https://github.com/zpeide/searchx-frontend-aqgsal.git
```

- Use the following config
```
PORT=32000
REACT_APP_PUBLIC_URL=http://localhost:80
REACT_APP_SERVER_URL=http://localhost:8080
REACT_APP_RENDERER_URL=http://localhost:3000/render
```



**

|   |   |
|---|---|
|ID|5|
|Title|Migrate service to the cloud|
|Contact|Peide Zhu, peide.zhu@lifewatch.eu|
|Description|SearchX is a scalable collaborative search system to facilitate collaborative search and sensemaking. It includes the frontend that serves the interface and the backend that is responsible for fetching search requests to the search provider and managing the application's data. A university wants to migrate the SearchX system to the cloud. The solution should require minimal maintenance for the engineers who manage the multi-cloud environments. Currently, the application is deployed as a block, including a frontend, backend, and several dependencies (MongoDB, Redis, and Elasticsearch). They should be run as separate services independent of the front-end and back-end.|
|Requirements|Minimally:<br><br>1. Separate the Mongodb/Redis/Elasticsearch from the backend and frontend<br>    <br>2. A pipeline to containerize the application components, test them, and publish the images. This pipeline should be triggered by updates to the code repository.<br>    <br>3. Automated deployment of the application components  to a multi-cloud environment (this can rely, for example, on Kubernetes)<br>    <br>4. All code must be void of plaintext secrets<br>    <br><br>For extra points:<br><br>5. Monitoring<br>    <br>6. Automated rollback on errors (e.g. using canary testing)|
|Expected output|1. SearchX front-end and back-end services running on the cloud. <br>    <br>2. Automatic Mongodb/Redis/Elasticsearch service monitoring/ management.|
|References|https://github.com/searchx-framework/searchx-frontend<br><br>https://github.com/zpeide/searchx-backend-aqgsal https://www.elastic.co/guide/en/elasticsearch/reference/7.17/starting-elasticsearch.html<br><br>https://www.mongodb.com/docs/v6.0/tutorial/install-mongodb-on-ubuntu/|

**