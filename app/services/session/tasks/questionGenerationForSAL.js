'use strict';

const TASK_ID = "question-generation-for-sal";
const questionTypeSize = 4;
const underscore = require('underscore');
const mongoose = require('mongoose');
const Group = mongoose.model('Group');
const helper = require('../groupHelper');
const utils = require("../../../utils");

////

const topics = require('./data/topics.json');
Object.keys(topics).forEach((index) => {
    topics[index].id = index;
});

function sampleTopics(selected_topics) {
    let validTopics = underscore.omit(topics, '0');
    let samples = selected_topics.map((k)=>validTopics[k])
    // for (var k in validTopics){
    //     if(topics[k].title in selected_topics){
    //         samples.push(topics[k])
    //     }
    // }
    
    // samples.push(topics[0]);
    return samples;
}

////

const getAvailableGroup = async function(groupSize, selected_topics) {
    const initializeGroup = async function() {
        const group = new Group({
            created: new Date(),
            taskId: TASK_ID,
            taskData: {
                size: groupSize,
                topics: sampleTopics(selected_topics),
                scores: []
            }
        });

        await group.save();
        return group;
    };

    const query = {
        "taskData.topic": {$exists: false},
        "taskData.size": groupSize,
        "taskData.nMembers": {$lt: groupSize}
    };

    let group = await Group.findOne(query, {}, {sort: {created: 1}});
    if (group === null) {
        group = await initializeGroup();
    }

    return group;
};

exports.getRegisteredUserGroup = async function (userId, params) {
    let group = await helper.getGroupByUserId(userId, TASK_ID);
    if (group !== null) {
        return group;
    }    
};

exports.getUserTask = async function(userId, params) {
    let group = await helper.getGroupByUserId(userId, TASK_ID);
    if (group !== null) {
        return group;
    }

    const groupSize = parseInt(params.groupSize);
    const topicsSize = parseInt(params.topicsSize);
    const leastTopic = params.leastTopic;
    const bestTopic = params.bestTopic;
    var selected_topics = [leastTopic, bestTopic];    
    group = await getAvailableGroup(groupSize, selected_topics);
    group.members.push(helper.initializeMember(userId, {}));
    group.taskData.nMembers = group.members.length;

    group.markModified('members');
    group.markModified('taskData');
    await group.save();

    return group;
};

////

function getScoresFromResults(results) {
    function formatScores(scores) {
        return Object.keys(scores)
            .map(key => {
                return {
                    topicId: key,
                    score: scores[key]
                };
            })
            .sort((a,b) => a.score - b.score);
    }

    let scores = {};
    Object.keys(results).forEach((result) => {
        const v = result.split("-");
        if (v[0] === "Q") {
            if(!scores[v[1]]) scores[v[1]] = 0;
            scores[v[1]] += parseInt(results[result]);
        }
    });
    return formatScores(scores);
}

async function savePretestResults(userId, results) {
    const group = await helper.getGroupByUserId(userId, TASK_ID);
    if (group === null) {
        return;
    }

    const scores = getScoresFromResults(results);
    if (group.taskData.scores.filter(x => x.userId === userId).length <= 0) {
        group.taskData.scores.push({
            userId: userId,
            scores: scores
        });

        group.markModified('taskData');
        await group.save();
    }
    return null;
}

async function setGroupTopic(userId) {
    const group = await helper.getGroupByUserId(userId, TASK_ID);
    if (group === null) {
        return null;
    }

    const membersComplete = group.members.length >= group.taskData.size;
    const pretestComplete = group.taskData.scores.length >= group.taskData.size;
    if (!membersComplete || !pretestComplete) {
        return null;
    }

    ////

    let totals = {};
    group.taskData.scores.forEach(member => {
        member.scores.forEach(score => {
            const i = score.topicId;
            if (!totals[i]) totals[i] = 0;
            totals[i] += score.score;
        })
    });

    let minScore = Infinity;
    let ids = Object.keys(totals);
    const smallest = Math.min.apply(null, ids.map(x => totals[x]));
    let result = ids.reduce((result, key) => { if (totals[key] === smallest){ result.push(key); } return result; }, []);

    // Object.keys(totals).forEach(topicId => {
    //     if (totals[topicId] < minScore) {
    //        minScore = totals[topicId];
    //      minId = topicId;
    //    }
    // });
    let sorted_totals = Object.entries(totals).map((v)=>[v[1], v[0]]).sort();
    let minId = sorted_totals[0][1]==0?sorted_totals[1][1]:sorted_totals[0][1];
    let maxId = sorted_totals[sorted_totals.length-1][1]==0?sorted_totals[sorted_totals.length-2][1]:sorted_totals[sorted_totals.length-1][1];
    // randomly choose the best known topic or the least known topic as the task topic.
    let selectId = [minId, maxId][Math.floor(Math.random() * 2)]
    group.taskData.topic = topics[selectId.toString()];
    group.taskData.qid = 1; // Math.floor(Math.random() * questionTypeSize) - 1;

    group.markModified("members");
    group.markModified("taskData");
    await group.save();

    return group;
}

exports.handleSyncSubmit = async function(userId, data) {
    await savePretestResults(userId, data);
    return await setGroupTopic(userId);
};

exports.handleSyncLeave = async function(userId) {
    const group = await helper.getGroupByUserId(userId, TASK_ID);
    if (group === null || 'topic' in group.taskData) {
        return;
    }

    group.members = group.members.filter(x => x.userId !== userId);
    group.taskData.scores = group.taskData.scores.filter(x => x.userId !== userId);
    group.taskData.nMembers = group.members.length;

    group.markModified('members');
    group.markModified('taskData');
    await group.save();
};


exports.postUserTask = async function(userId, data) {
    let group = await helper.getGroupByUserId(userId, TASK_ID);
    if (group !== null) {
       return group;
    }

    const groupSize = parseInt(params.groupSize);
    const topicsSize = parseInt(params.topicsSize);
    group = await getAvailableGroup(groupSize, topicsSize);
    group.members.push(helper.initializeMember(userId, {}));
    group.taskData.nMembers = group.members.length;

    await savePretestResults(userId, data);
    return await setGroupTopic(userId);
};


