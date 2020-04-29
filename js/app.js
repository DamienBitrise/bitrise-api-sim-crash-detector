const WORKFLOWS = ['primary'];
const PERSONAL_ACCESS_TOKEN = '';
const APP_SLUG = '';
const LAST_BUILD_SLUG = '';
const MIN_BUILD_NUMBER = 0;

let datatable = null;
let datatable_stats = null;
let data = [];
let currentMinBuildNumber = 9999999;

function initTables(){
    datatable = $('#example').DataTable( {
        "data": [],
        "pageLength": 10,
        "order": [[ 2, "desc" ],[ 4, "desc" ],[ 0, "asc" ]],
        "createdRow": function( row, data, dataIndex ) {
            if ( data.SimError == true ) {
                $(row).addClass('red');
            } else if (data.SimError == false) {
                $(row).addClass('green');
            }else{
                $(row).addClass('yellow');
            }
        },
        "columns": [
            { "data": "BuildNum" },
            { "data": "Build" },
            { "data": "Machine" },
            { "data": "VMs" },
            { "data": "Workflow" },
            { "data": "Sims" },
            { "data": "Time" },
            { "data": "Result" },
            { "data": "SimError" }
        ]
    } );
    datatable_stats = $('#stats').DataTable( {
        "data": [],searching: false, paging: false, info: false, autoWidth: false,
        "columns": [
            { "data": "Machine" },
            { "data": "VMs" },
            { "data": "Sims" },
            { "data": "Average" },
            { "data": "Min" },
            { "data": "Max" },
            { "data": "Total" },
            { "data": "Builds" },
            { "data": "Passed" },
            { "data": "Failed" },
            { "data": "FailureRate" }
        ]
    } );
}
function loadData(){
    processBuilds(APP_SLUG, LAST_BUILD_SLUG, 0);
}

function processBuilds(appSlug, next, offset){
    getBuilds(appSlug, next)
    .then(result => {
        let builds = result.data.filter(build => WORKFLOWS.includes(build.triggered_workflow) && build.status_text != 'aborted');
        builds.forEach((build, buildNumber) => {
            if(build.build_number < currentMinBuildNumber){
                currentMinBuildNumber = build.build_number;
            }
            if(build.build_number > MIN_BUILD_NUMBER){
                processLogs(appSlug, build, buildNumber + offset);
            }
        })
        if(result.paging.next && currentMinBuildNumber > MIN_BUILD_NUMBER){
            processBuilds(appSlug, result.paging.next, offset + builds.length)
        }
    })
    .catch(error => console.log('error', error));
}

function processLogs(appSlug, build, buildNumber){
    getBuildLogs(appSlug, build.slug)
    .then(result => {
        if(!result.expiring_raw_log_url){
            processErrors(appSlug, build, 'No Log', buildNumber);
        }else{
            getBuildLogContent(result.expiring_raw_log_url)
                .then(result => {
                    processErrors(appSlug, build, result, buildNumber);
                })
                .catch(error => {
                    
                });
        }
    })
    .catch(error => console.log('error', error));
}

function processErrors(app, build, result, buildNumber){
    let buildNum = buildNumber;
    parseLogForErrors(result, (hasSimError) => {
        // console.log('Has Sim Error: ', hasSimError);
        let row = {}
        row.Machine = '6 Core 32GB 1 VM';
        row.VMs = 1;
        row.Sims = 'Unknown';

        row.Build = '<a href="https://app.bitrise.io/build/'+build.slug+'#?tab=log">'+build.slug+'</a>'

        let startedAt = new Date(build.triggered_at);
        let finishedAt = new Date(build.finished_at);
        var diff = Math.abs(startedAt - finishedAt);

        if(build.status_text != 'in-progress'){
            var minutes = Math.floor((diff/1000)/60);
            var seconds = Math.floor((diff/1000)/60/60) % 60;

            row.Time = minutes + ' min ' + seconds + ' sec';
            row.BuildTime = diff;
            row.BuildNum = build.build_number;
            row.Result = build.status_text;
            row.SimError = hasSimError == 'No Log' ? 'No Log' : hasSimError;
            row.Workflow = build.triggered_workflow;
            row.Running = build.status_text == 'in-progress' ? true : false;
            row.Slug = build.slug;
            data.push(row);

            datatable.clear();
            datatable.rows.add(data);
            datatable.draw();

            let stats = getStats(data);
            datatable_stats.clear();
            datatable_stats.rows.add(stats);
            datatable_stats.draw();
        }
    })
}