// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/*
 * @package    atto_popup
 * @copyright  2014 Tõnis Tartes <tonis.tartes@gmail.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * @module moodle-atto_popup-button
 */

/**
 * Atto text editor popup plugin.
 *
 * @namespace M.atto_popup
 * @class button
 * @extends M.editor_atto.EditorPlugin
 */

var COMPONENTNAME = 'atto_popup',
    CSS = {
        TITLEINPUT: 'atto_popup_title',
        CONTENTINPUT: 'atto_popup_content'
    },
    SELECTORS = {
        TITLEINPUT: '.atto_popup_title',
        CONTENTINPUT: '.atto_popup_content'
    },
    TEMPLATE = '' +
            '<form class="atto_form">' +
                '<label for="{{elementid}}_atto_popup_title">{{get_string "popuptitle" component}}*</label>' +
                '<input class="popup title {{CSS.TITLEINPUT}}" type="title" id="{{elementid}}_atto_popup_title"/><br/>' +
                '<label for="{{elementid}}_atto_popup_content">{{get_string "popupcontent" component}}</label>' +
                '<textarea class="popup content {{CSS.CONTENTINPUT}}" type="content" id="{{elementid}}_atto_popup_content" rows="10"></textarea>' +
                '<br/>' +
                '<div class="mdl-align">' +
                    '<br/>' +
                    '<button type="submit" class="submit">{{get_string "createpopup" component}}</button>' +
                '</div>' +
            '</form>';
    
Y.namespace('M.atto_popup').Button = Y.Base.create('button', Y.M.editor_atto.EditorPlugin, [], {
    
    /**
     * A reference to the current selection at the time that the dialogue
     * was opened.
     *
     * @property _currentSelection
     * @type Range
     * @private
     */
    _currentSelection: null,

    /**
     * A reference to the dialogue content.
     *
     * @property _content
     * @type Node
     * @private
     */
    _content: null,
    
    initializer: function() {
        this.addButton({
            icon: 'icon',
            iconComponent: 'atto_popup',
            callback: this._displayDialogue
        });
    },
    /**
     * Display the link editor.
     *
     * @method _displayDialogue
     * @private
     */
    _displayDialogue: function() {
        // Store the current selection.
        this._currentSelection = this.get('host').getSelection();
       
        if (this._currentSelection === false || this._currentSelection.collapsed) {
            return;
        }

        var dialogue = this.getDialogue({
            headerContent: M.util.get_string('createpopup', COMPONENTNAME),
            focusAfterHide: true,
            focusOnShowSelector: SELECTORS.TITLEINPUT
        });

        // Set the dialogue content, and then show the dialogue.
        dialogue.set('bodyContent', this._getDialogueContent());

        dialogue.show();
    },

    /**
     * Generates the content of the dialogue.
     *
     * @method _getDialogueContent
     * @return {Node} Node containing the dialogue content
     * @private
     */
    _getDialogueContent: function() {

        var template = Y.Handlebars.compile(TEMPLATE);
        this._content = Y.Node.create(template({
            component: COMPONENTNAME,
            CSS: CSS
        }));

        //Set title from selection
        if (this._currentSelection !== false || !this._currentSelection.collapsed) {
            var title = this._currentSelection[0].commonAncestorContainer.data.toString();
            title = title.substring(this._currentSelection[0].startOffset, this._currentSelection[0].endOffset);
            this._content.one(SELECTORS.TITLEINPUT).set('value', title);
        }
        
        this._content.one('.submit').on('click', this._createPopup, this);

        return this._content;
    },
    
    /**
     * The link was inserted, so make changes to the editor source.
     *
     * @method _setLink
     * @param {EventFacade} e
     * @private
     */
    _createPopup: function(e) {
        var inputtitle,
            inputcontent,
            titlevalue,
            contentvalue,
            content;

        var host = this.get('host');
                
        e.preventDefault();
        
        inputtitle = this._content.one(SELECTORS.TITLEINPUT);
        inputcontent = this._content.one(SELECTORS.CONTENTINPUT);
        
        titlevalue = inputtitle.get('value');
        contentvalue = inputcontent.get('value');
        
        if (!titlevalue.trim()) {
            return;
        }
        
        if (titlevalue !== '' || contentvalue !== '') {
            titlevalue = titlevalue.replace(/(<([^>]+)>)/ig,"");
            contentvalue = contentvalue.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/ig,""); //Clear script tags from content
            contentvalue = contentvalue.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/ig,""); //Clear iframe tags from content
            content = '[popup][poptitle]'+titlevalue+'[/poptitle]'+contentvalue+'[/popup]';
            
            host.setSelection(this._currentSelection);
            host.insertContentAtFocusPoint(content);
            
            this.getDialogue({
                focusAfterHide: null
            }).hide();            
            this.editor.focus();
            this.markUpdated();
        }
    }
});
