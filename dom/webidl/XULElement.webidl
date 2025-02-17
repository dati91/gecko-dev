/* -*- Mode: IDL; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/.
 */

interface XULControllers;

[HTMLConstructor, Func="IsChromeOrXBL"]
interface XULElement : Element {
  // Layout properties
  [SetterThrows]
  attribute DOMString align;
  [SetterThrows]
  attribute DOMString dir;
  [SetterThrows]
  attribute DOMString flex;
  [SetterThrows]
  attribute DOMString ordinal;
  [SetterThrows]
  attribute DOMString orient;
  [SetterThrows]
  attribute DOMString pack;

  // Properties for hiding elements.
  attribute boolean hidden;
  attribute boolean collapsed;

  // Property for hooking up to broadcasters
  [SetterThrows]
  attribute DOMString observes;

  // Properties for hooking up to popups
  [SetterThrows]
  attribute DOMString menu;
  [SetterThrows]
  attribute DOMString contextMenu;
  [SetterThrows]
  attribute DOMString tooltip;

  // Width/height properties
  [SetterThrows]
  attribute DOMString width;
  [SetterThrows]
  attribute DOMString height;
  [SetterThrows]
  attribute DOMString minWidth;
  [SetterThrows]
  attribute DOMString minHeight;
  [SetterThrows]
  attribute DOMString maxWidth;
  [SetterThrows]
  attribute DOMString maxHeight;

  // Position properties for
  // * popups - these are screen coordinates
  // * other elements - these are client coordinates relative to parent stack.
  [SetterThrows]
  attribute DOMString left;
  [SetterThrows]
  attribute DOMString top;

  // Tooltip
  [SetterThrows]
  attribute DOMString tooltipText;

  // Properties for images
  [SetterThrows]
  attribute DOMString src;

  attribute boolean allowEvents;

  [Throws, ChromeOnly]
  readonly attribute XULControllers             controllers;
  [Throws]
  readonly attribute BoxObject?                 boxObject;

  [Throws]
  void                      focus();
  [Throws]
  void                      blur();
  [NeedsCallerType]
  void                      click();
  void                      doCommand();

  // XXXbz this isn't really a nodelist!  See bug 818548
  NodeList            getElementsByAttribute(DOMString name,
                                             DOMString value);
  // XXXbz this isn't really a nodelist!  See bug 818548
  [Throws]
  NodeList            getElementsByAttributeNS(DOMString namespaceURI,
                                               DOMString name,
                                               DOMString value);
  [Constant]
  readonly attribute CSSStyleDeclaration style;
};

XULElement implements GlobalEventHandlers;
XULElement implements TouchEventHandlers;
XULElement implements OnErrorEventHandlerForNodes;
