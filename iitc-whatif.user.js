// ==UserScript==
// @id             iitc-whatif
// @name           IITC Plugin: What If - Simulate Portal Destruction
// @category       Layer
// @version        0.5
// @namespace      https://secyourity.se
// @description    Simulates what happens if enemy portals are destroyed by changing their color to red instead of hiding them.
// @include        https://intel.ingress.com/*
// @match          https://intel.ingress.com/*
// @grant          none
// ==/UserScript==

(function () {
    'use strict';

    function whatIfPlugin() {
        if (!window.plugin) window.plugin = {};

        window.plugin.whatIf = function () {
            console.log("What If Plugin Loaded!");

            // Store hidden portals, links, and fields
            window.plugin.whatIf.hiddenPortals = new Set();
            window.plugin.whatIf.originalColors = new Map();

            // Function to change the color of a portal, its links, and fields to red
            window.plugin.whatIf.markPortal = function (portalGuid) {
                if (!portalGuid || window.plugin.whatIf.hiddenPortals.has(portalGuid)) return;

                window.plugin.whatIf.hiddenPortals.add(portalGuid);

                let markedLinks = 0;
                let markedFields = 0;

                // Change portal color
                if (window.portals[portalGuid]) {
                    let portal = window.portals[portalGuid];
                    window.plugin.whatIf.originalColors.set(portalGuid, portal.options.color);
                    portal.setStyle({ color: 'red', fillColor: 'red' });
                }

                // Change links color
                for (let linkGuid in window.links) {
                    let link = window.links[linkGuid];
                    if (link.options.data.oGuid === portalGuid || link.options.data.dGuid === portalGuid) {
                        window.plugin.whatIf.originalColors.set(linkGuid, link.options.color);
                        link.setStyle({ color: 'red' });
                        markedLinks++;
                    }
                }

                // Change fields color
                for (let fieldGuid in window.fields) {
                    let field = window.fields[fieldGuid];
                    if (field.options.data.points.some(p => p.guid === portalGuid)) {
                        window.plugin.whatIf.originalColors.set(fieldGuid, field.options.fillColor);/
                        field.setStyle({ fillColor: 'red' });
                        markedFields++;
                    }
                }

                //console.log(`Marked portal ${portalGuid} and its ${markedLinks} links, ${markedFields} fields as red.`);
                window.plugin.whatIf.updateHiddenList();
            };

            // Function to restore a portal, its links, and fields to their original color
            window.plugin.whatIf.unmarkPortal = function (portalGuid) {
                if (!portalGuid || !window.plugin.whatIf.hiddenPortals.has(portalGuid)) return;

                window.plugin.whatIf.hiddenPortals.delete(portalGuid);

                // Restore portal color
                if (window.portals[portalGuid] && window.plugin.whatIf.originalColors.has(portalGuid)) {
                    let portal = window.portals[portalGuid];
                    portal.setStyle({ color: window.plugin.whatIf.originalColors.get(portalGuid) });
                }

                // Restore links color
                for (let linkGuid in window.links) {
                    if (window.plugin.whatIf.originalColors.has(linkGuid)) {
                        let link = window.links[linkGuid];
                        if (link.options.data.oGuid === portalGuid || link.options.data.dGuid === portalGuid) {
                            link.setStyle({ color: window.plugin.whatIf.originalColors.get(linkGuid) });
                        }
                    }
                }

                // Restore fields color
                for (let fieldGuid in window.fields) {
                    if (window.plugin.whatIf.originalColors.has(fieldGuid)) {
                        let field = window.fields[fieldGuid];
                        if (field.options.data.points.some(p => p.guid === portalGuid)) {
                            field.setStyle({ fillColor: window.plugin.whatIf.originalColors.get(fieldGuid) });
                        }
                    }
                }

                //console.log(`Restored portal ${portalGuid} and its links/fields to original colors.`);
                window.plugin.whatIf.updateHiddenList();
            };

            // Add "Mark Portal" link to the portal info popup
            window.addHook('portalDetailsUpdated', function () {
                let portalGuid = window.selectedPortal;
                if (!portalGuid) return;

                let markButton = $('<a>')
                    .text('Mark Portal')
                    .css({ display: 'block', color: 'red', cursor: 'pointer', marginTop: '5px' })
                    .click(() => {
                        window.plugin.whatIf.markPortal(portalGuid);
                    });

                $('#portaldetails').append(markButton);
            });

            // Function to update the marked portals list display
            window.plugin.whatIf.updateHiddenList = function () {
                let container = $("#hidden-portals-container");
                if (container.length === 0) {
                    $("body").append(`
                        <div id="hidden-portals-container" style="
                            position: fixed;
                            bottom: 50px;
                            right: 20px;
                            width: 250px;
                            background: white;
                            border: 1px solid black;
                            padding: 10px;
                            z-index: 1000;
                            font-size: 12px;">
                            <strong>Marked Portals</strong>
                            <div id="hidden-portals-list"></div>
                        </div>
                    `);
                }

                let list = $("#hidden-portals-list");
                list.empty();

                if (window.plugin.whatIf.hiddenPortals.size === 0) {
                    list.append("<p>No portals marked.</p>");
                } else {
                    window.plugin.whatIf.hiddenPortals.forEach(portalGuid => {
                        let portalName = window.portals[portalGuid]?.options?.data?.title || "Unknown Portal";
                        let listItem = $(`<div style="margin-bottom: 5px;">
                            <span>${portalName}</span>
                            <a href="#" style="margin-left: 10px; color: blue; text-decoration: underline;">Unmark</a>
                        </div>`);

                        listItem.find("a").click(() => {
                            window.plugin.whatIf.unmarkPortal(portalGuid);
                        });

                        list.append(listItem);
                    });
                }
            };
        };

        var setup = function () {
            window.plugin.whatIf();
        };

        if (window.iitcLoaded) setup();
        else window.addHook('iitcLoaded', setup);
    }

    // Inject plugin
    var script = document.createElement('script');
    script.appendChild(document.createTextNode('(' + whatIfPlugin + ')();'));
    (document.body || document.head || document.documentElement).appendChild(script);
})();
