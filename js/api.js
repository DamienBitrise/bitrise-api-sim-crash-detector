const BASE_URL = "https://api.bitrise.io/v0.1/apps"
const myHeaders = new Headers();
myHeaders.append("accept", "application/json");
myHeaders.append("Authorization", PERSONAL_ACCESS_TOKEN);

const requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow'
};

function getApps(){
    return fetch(BASE_URL, requestOptions)
        .then(response => response.json())
}

function getBuilds(appSlug, next){
    let nextStr = next ? '?next='+next : '';
    return fetch(BASE_URL+'/'+appSlug+'/builds'+nextStr, requestOptions)
        .then(response => response.json())
}

function getBuildLogs(appSlug, buildSlug){
    return fetch(BASE_URL+'/'+appSlug+'/builds/'+buildSlug+'/log', requestOptions)
        .then(response => response.json());
}

function getBuildLogContent(buildLogUrl){
    return fetch(buildLogUrl)
    .then(response => response.blob());
}

function parseLogForErrors(blob, callback){
    if(blob == 'No Log'){
        callback('No Log');
        return;
    }
    const reader = new FileReader();
    reader.addEventListener('loadend', (e) => {
        callback(e.srcElement.result.indexOf('Testing failed:') != -1);
    });
    reader.readAsText(blob);
}

function getStats(data){
    let stats = {};
    let timings = getTimings(data);
    data.forEach(row => {
        let key = getKey(row);

        if(!stats[key]){
            stats[key] = {
                Machine: row.Machine,
                VMs: row.VMs,
                Sims: row.Sims,
                Average: row.SimError != 'No Log' ? timings[key].avg : 0,
                Min : row.SimError != 'No Log' ? timings[key].min : 0,
                Max : row.SimError != 'No Log' ? timings[key].max : 0,
                Total : row.SimError != 'No Log' ? timings[key].total : 0,
                Builds: row.SimError == 'No Log' ? 0 : 1,
                Passed: row.SimError != null && row.SimError == false && row.SimError != 'No Log' ? 1 : 0,
                Failed: row.SimError != null && row.SimError == true && row.SimError != 'No Log' ? 1 : 0,
                FailureRate: row.SimError ? 100 : 0
            }
        } else {
            stats[key] = {
                Machine: row.Machine,
                VMs: row.VMs,
                Sims: row.Sims,
                Average: row.SimError != 'No Log' ? timings[key].avg : 0,
                Min : row.SimError != 'No Log' ? timings[key].min : 0,
                Max : row.SimError != 'No Log' ? timings[key].max : 0,
                Total : row.SimError != 'No Log' ? timings[key].total : 0,
                Builds: stats[key].Builds + (row.SimError == 'No Log' ? 0 : 1),
                Passed: stats[key].Passed + (row.SimError == false && row.SimError != 'No Log' ? 1 : 0),
                Failed: stats[key].Failed + (row.SimError == true && row.SimError != 'No Log' ? 1 : 0)
            }

            stats[key].FailureRate = stats[key].Failed ? Math.round((stats[key].Failed / stats[key].Builds) * 1000) / 10 + '%' : '0%';
            
        }
    })

    let statsArr = [];
    let keys = Object.keys(stats);
    keys.forEach(key => {
        statsArr.push(stats[key])
    })

    return statsArr;
}

function getKey(row){
    return row.Machine + '_' + row.VMs + '_' + row.Workflow;
}

function getTimings(data){
    let timeData = {};
    let lastTimeData = {};
    data.forEach(row => {
        if(row.SimError == 'No Log'){
            return;
        }
        let key = getKey(row);
        if(!timeData[key]){
            timeData[key] = {
                count: 0,
                avg: 0,
                min: 0,
                max: 0,
                total: 0
            };
        }
        let timings = timeData[key];
        timings.total += row.BuildTime;
        timings.avg = Math.round((timings.total / (timings.count+1)) * 100)/100;

        if(timings.min == 0 || row.BuildTime < timings.min){
            timings.min = row.BuildTime;
        }

        if(row.BuildTime > timings.max){
            timings.max = row.BuildTime;
        }

        let avg_minutes = Math.floor((timings.avg / (1000 * 60)));
        let avg_seconds = Math.floor((timings.avg / 1000) % 60);
        let avg_time = avg_minutes + ' min ' + avg_seconds + ' sec';

        let min_minutes = Math.floor((timings.min / (1000 * 60)));
        let min_seconds = Math.floor((timings.min / 1000) % 60);
        let min_time = min_minutes + ' min ' + min_seconds + ' sec';

        let max_minutes = Math.floor((timings.max / (1000 * 60)));
        let max_seconds = Math.floor((timings.max / 1000) % 60);
        let max_time = max_minutes + ' min ' + max_seconds + ' sec';

        let total_hours = Math.floor((timings.total / (1000 * 60 * 60)));
        let total_minutes = Math.floor((timings.total / (1000 * 60)) % 60);
        let total_seconds = Math.floor((timings.total / 1000) % 60);
        let total_time = total_hours + ' hrs ' + total_minutes + ' min ' + total_seconds + ' sec';

        timings.count++;
        lastTimeData[key] = {
            avg: avg_time,
            min: min_time,
            max: max_time,
            total: total_time
        };
    });
    return lastTimeData;
}
