var togglApi = {
    headers: {
        Authorization: null,
        "Content-Type": "application/json"
    },
    workspaceId: null, //has to be intitialized
    projectMap: null, //has to be intitialized
}


InitializeTogglApi();

//initialize toggl api
async function InitializeTogglApi()
{
    await InitializeFromSettingsAsync();

    //get workspaces.
    try {
        let response = await fetch("https://api.track.toggl.com/api/v9/me/workspaces", {
            method: "GET",
            headers: togglApi.apiHeaders
        });

        if (response.ok) {
            let json = await response.json();
            togglApi.workspaceId = json[0].id
        }
        else {
            console.error("Error fetching workspaces.")
        }
    }
    catch (ex) {
        console.error(ex);
    }

    //get projects
    try {
        let response = await fetch(`https://api.track.toggl.com/api/v9/workspaces/${togglApi.workspaceId}/projects`, {
            method: "GET",
            headers: togglApi.apiHeaders
        });

        if (response.ok) {
            let projects = await response.json();

            togglApi.projectMap = {};
            for (let i = 0; i < projects.length; ++i) {
                let project = projects[i];
                togglApi.projectMap[project.name.toLowerCase()] = project.id;
            }
        }
        else {
            console.error("Error fetching workspaces.")
        }
    }
    catch (ex) {
        console.error(ex);
    }
}

async function InitializeFromSettingsAsync()
{
    let readStorage = await ReadLocalStorageAsync({ api_key: '' })
    togglApi.headers.Authorization = `Basic ${btoa(`${readStorage.api_key}:api_token`)}`;
}


chrome.runtime.onMessage.addListener( // this is the message listener
    function(request, sender, sendResponse) {
        switch(request.message)
        {
            case "startTracking":
            {
                Handle_StartTracktingAsync(request, sender, sendResponse);
                return true;
            }
            case "stopTracking":
            {
                Handle_StopTrackingAsync(request, sender, sendResponse);
                return true;
            }
            case "getTimeEntry":
            {
                Handle_GetTimeEntryAsync(request, sender, sendResponse);
                return true;
            }
            case "optionsUpdated":
            {
                InitializeFromSettingsAsync();
                sendResponse({success: true});
                return true;
            }
        }
    }
);

async function Handle_StartTracktingAsync(request, sender, sendResponse) {
    try {
        let result = await fetch(`https://api.track.toggl.com/api/v9/workspaces/${togglApi.workspaceId}/time_entries`,
        {
            method: "POST",
            headers: togglApi.apiHeaders,
            body: JSON.stringify({
                billable: true,
                created_with: "Ru's github toggle tracker.",
                description: request.options.description,
                project_id: request.options.project ? togglApi.projectMap[request.options.project.toLowerCase()] : null,
                duration: -1,
                start: new Date().toISOString(),
                workspaceId: togglApi.workspaceId,
                wid: togglApi.workspaceId
            })
        });

        if (result.ok == false) {
            let json = await result.json();
            console.warn(json);
            sendResponse({ success: false, body: json });
            return;
        }

        await sendResponse({ success: true });
        return;

    }
    catch (ex) {
        await sendResponse({ success: false });
        return;
    }
}


async function Handle_StopTrackingAsync(request, sender, sendResponse) {
    try {
        //https://api.track.toggl.com/api/v9/me/time_entries/current
        let response = await fetch(`https://api.track.toggl.com/api/v9/me/time_entries/current`, {
            method: "GET",
            headers: togglApi.apiHeaders
        });

        if (response.ok == false) {
            sendResponse({ success: false });
            return;
        }

        let timeEntry = await response.json();
        if (timeEntry == null) {
            sendResponse({ success: false });
            return;
        }

        response = await fetch(`https://api.track.toggl.com/api/v9/workspaces/${togglApi.workspaceId}/time_entries/${timeEntry.id}/stop`, {
            method: "PATCH",
            headers: togglApi.apiHeaders
        });

        if (response.ok == false) {
            sendResponse({ success: false });
            return;
        }

        sendResponse({ success: true });
    }
    catch (ex) {
        sendResponse({ success: false });
        return;
    }
}


async function Handle_GetTimeEntryAsync(request, sender, sendResponse)
{
    try {
        //https://api.track.toggl.com/api/v9/me/time_entries/current
        let response = await fetch(`https://api.track.toggl.com/api/v9/me/time_entries/current`, {
            method: "GET",
            headers: togglApi.apiHeaders
        });

        if (response.ok == false) {
            sendResponse({ success: false });
            return;
        }

        let timeEntry = await response.json();

        sendResponse({ success: true, "timeEntry": timeEntry });
    }
    catch (ex) {
        sendResponse({ success: false });
        return;
    }
}


async function ReadLocalStorageAsync(items) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(items, function (result) {
            if (result === undefined) {
                reject();
            } else {
                resolve(result);
            }
        });
    });
};