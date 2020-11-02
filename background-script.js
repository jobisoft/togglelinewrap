/*
 * Toggle Line Wrap Thunderbird Add-On
 *
 * Copyright (c) Jan Kiszka, 2020
 *
 * Authors:
 *  Jan Kiszka <jan.kiszka@web.de>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

async function updateComposeAction(tab, defaultWidth)
{
    if (defaultWidth === 0) {
        messenger.composeAction.disable(tab.id);
        return;
    }

    let width = await messenger.composeLineWrap.getEditorWrapWidth(tab.windowId);
    messenger.composeAction.setBadgeText({
        tabId: tab.id,
        text: (width === 0) ? "off" : ""
    });
    messenger.composeAction.enable(tab.id);
}

async function toggleLineWrap(tab)
{
    let defaultWidth = await messenger.composeLineWrap.getDefaultWrapWidth(tab.windowId);
    if (defaultWidth === 0) {
        return;
    }

    let width = await messenger.composeLineWrap.getEditorWrapWidth(tab.windowId);
    if (width > 0) {
        width = 0;
    } else {
        width = defaultWidth;
    }
    messenger.composeLineWrap.setEditorWrapWidth(tab.windowId, width);

    updateComposeAction(tab, defaultWidth);
}

async function updateWindow(windowId)
{
    let window = await messenger.windows.get(windowId);

    if (window.type === "messageCompose") {
        let defaultWidth = await messenger.composeLineWrap.getDefaultWrapWidth(window.id);
        messenger.tabs.query({windowId: window.id}).then(tabs => {;
            updateComposeAction(tabs[0], defaultWidth);
        });
    }
}

async function main()
{
    messenger.composeAction.disable();

    messenger.windows.onFocusChanged.addListener(windowId => {
        if (windowId !== messenger.windows.WINDOW_ID_NONE) {
            updateWindow(windowId);
        }
    });

    messenger.commands.onCommand.addListener(name => {
        if (name === "toggleLineWrap") {
            messenger.windows.getAll().then(windows => {
                for (let window of windows) {
                    if (window.type === "messageCompose" && window.focused === true) {
                        messenger.tabs.query({windowId: window.id}).then(tabs => {
                            toggleLineWrap(tabs[0]);
                        });
                        break;
                    }
                }
            });
        }
    });

    messenger.composeAction.onClicked.addListener(tab => {
        toggleLineWrap(tab);
    });
}

main();
