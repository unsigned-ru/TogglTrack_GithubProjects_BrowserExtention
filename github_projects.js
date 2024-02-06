var primerPortalRoot;
var isPanelOpen = false;
var panelType = null;
var panel = null;

var elementIds =
{
    portalRoot: "__primerPortalRoot__",
    panel: {
        issue: ".Box-sc-g0xbh4-0.gjxYlD",
        draft: ".Box-sc-g0xbh4-0.jjUduE",
    },
    buttonDiv: 
    {
        issue: ".Box-sc-g0xbh4-0.dwMhYP",
        draft: ".Box-sc-g0xbh4-0.hVseOf",
    },
    titleBdi:
    {
        issue: ".Box-sc-g0xbh4-0.jAidiD.markdown-title",
        draft: ".Text-sc-17v1xeu-0.gPDEWA",
    },
    projectName: ".Text-sc-17v1xeu-0.cwKGMJ"
}


window.addEventListener('load', function() {
    // Get preview panel
    primerPortalRoot = document.getElementById(elementIds.portalRoot);
    console.assert(primerPortalRoot);

    //add mutation observer for primer root
    let mutationObserver = new MutationObserver(function (mutationRecords) {
                
        let is_panel_added = false;
        let is_panel_deleted = false; 

        //loop over records
        for (let i = 0; i < mutationRecords.length; ++i)
        {
            let record = mutationRecords[i];
            if (record.type == "childList")
            {
                //loop over added nodes
                for (let j = 0; j < record.addedNodes.length; ++j)
                {
                    //check if panel got added
                    let node = record.addedNodes[j];
                    
                    panel = node.querySelector(elementIds.panel.issue);
                    if (panel != null)
                    {
                        //panel is added.
                        panelType = "issue";
                        is_panel_added = true;

                        //break out of added nodes loop
                        break;
                    }
                    
                    panel = node.querySelector(elementIds.panel.draft);
                    if (panel != null)
                    {
                        //panel is added.
                        panelType = "draft";
                        is_panel_added = true;
                        

                        //break out of added nodes loop
                        break;
                    }
                }

                if (is_panel_added == true) 
                {
                    //break out of loop
                    break;
                }
                
                if (record.removedNodes.length > 0)
                {
                    //panel is deleted.
                    is_panel_deleted = true;

                    //break out of removed nodes loop
                    break;
                }
            }
        }

        if (is_panel_added)
        {
            //avoid triggering events more than once
            if (isPanelOpen == false)
            {
                isPanelOpen = true;
                OnPanelOpen();
            }
        }
        else if (is_panel_deleted)
        {
            if (isPanelOpen == true)
            {
                isPanelOpen = false;
                panelType = null;
                OnPanelClosed();
            }
        }
    })

    //start observing
    mutationObserver.observe(primerPortalRoot, { childList: true });
})


async function TrackTimer_Clicked()
{
    //fetch data and
    //form request
    let req = {};
    req.message = "startTracking";

    //get description 
    req.options = {};

    let descriptionElement = await WaitForNonNullAsync(() => primerPortalRoot.querySelector(elementIds.titleBdi[panelType]));
    req.options.description = descriptionElement.innerText;

    //get project
    let projectElement = await WaitForNonNullAsync(() => document.querySelector(elementIds.projectName));
    req.options.project = projectElement.innerText;

    let res = await chrome.runtime.sendMessage(req);

    if (res.success)
    {
        alert("Time tracking started.")
    }
    else
    {
        alert("Failure detected.");
    }
}

async function OnPanelOpen()
{
    console.log(`${panelType} panel opened`);

    let pollRateMs = 500
    
    //add track time button to panel
    var buttonDiv = await WaitForNonNullAsync(() => primerPortalRoot.querySelector(elementIds.buttonDiv[panelType]), pollRateMs);
    console.assert(buttonDiv);

    //create tracking button
    var trackButton = document.createElement("button");
    trackButton.textContent = "Track Time";
    trackButton.addEventListener("click", TrackTimer_Clicked);

    //add button to button div
    buttonDiv.appendChild(trackButton);
}

async function OnPanelClosed()
{
    console.log("panel opened");
}

//----- helpers ---------

async function WaitForNonNullAsync(lambda, pollRateMs = 500)
{
    var res;

    while(true)
    {
        res = await lambda();
        console.log(res);
        if (res != null)
        {
            return res;
        }
        
        await delay(pollRateMs);
    }

}

const delay = ms => new Promise(res => setTimeout(res, ms))


//async wrapper for sendMessage
function sendMessageAsync(req) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(req, response => {
            if(response.complete) {
                resolve();
            } 
            else {
                reject('Something wrong');
            }
        });
    });
}