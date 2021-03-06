// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

goog.provide('goog.events.OnlineHandlerTest');
goog.setTestOnly('goog.events.OnlineHandlerTest');

goog.require('goog.events');
goog.require('goog.events.BrowserFeature');
goog.require('goog.events.Event');
goog.require('goog.events.EventHandler');
goog.require('goog.events.OnlineHandler');
goog.require('goog.net.NetworkStatusMonitor');
goog.require('goog.testing.MockClock');
goog.require('goog.testing.PropertyReplacer');
goog.require('goog.testing.jsunit');
goog.require('goog.testing.recordFunction');

var stubs = new goog.testing.PropertyReplacer();
var clock = new goog.testing.MockClock();
var online = true;
var onlineCount;
var offlineCount;

function listenToEvents(oh) {
  onlineCount = 0;
  offlineCount = 0;

  goog.events.listen(oh, goog.net.NetworkStatusMonitor.EventType.ONLINE,
                     function(e) {
                       assertTrue(oh.isOnline());
                       onlineCount++;
                     });
  goog.events.listen(oh, goog.net.NetworkStatusMonitor.EventType.OFFLINE,
                     function(e) {
                       assertFalse(oh.isOnline());
                       offlineCount++;
                     });
}

function setUp() {
  stubs.set(goog.events.OnlineHandler.prototype, 'isOnline', function() {
    return online;
  });
}

function tearDown() {
  stubs.reset();
  clock.uninstall();
}

function testConstructAndDispose() {
  var oh = new goog.events.OnlineHandler();
  oh.dispose();
}

function testNoOnlineProperty() {
  stubs.set(goog.events.BrowserFeature,
      'HAS_NAVIGATOR_ONLINE_PROPERTY', false);
  stubs.set(goog.events.EventHandler.prototype, 'listen',
      goog.testing.recordFunction());

  var oh = new goog.events.OnlineHandler();

  assertEquals(0, oh.eventHandler_.listen.getCallCount());

  oh.dispose();
}

function testNonHtml5() {
  clock.install();
  stubs.set(goog.events.BrowserFeature,
      'HAS_HTML5_NETWORK_EVENT_SUPPORT', false);

  var oh = new goog.events.OnlineHandler();
  listenToEvents(oh);

  clock.tick(500);
  online = false;
  clock.tick(500);

  assertEquals(0, onlineCount);
  assertEquals(1, offlineCount);

  online = true;
  clock.tick(500);

  assertEquals(1, onlineCount);
  assertEquals(1, offlineCount);

  oh.dispose();
  clock.dispose();
}

function testHtml5() {
  stubs.set(goog.events.BrowserFeature,
      'HAS_HTML5_NETWORK_EVENT_SUPPORT', true);

  // Test for browsers that fire network events on document.body.
  stubs.set(goog.events.BrowserFeature,
      'HTML5_NETWORK_EVENTS_FIRE_ON_BODY', true);

  var oh = new goog.events.OnlineHandler();
  listenToEvents(oh);

  online = false;
  var e = new goog.events.Event('offline');
  goog.events.fireListeners(document.body, e.type, false, e);

  assertEquals(0, onlineCount);
  assertEquals(1, offlineCount);

  online = true;
  e = new goog.events.Event('online');
  goog.events.fireListeners(document.body, e.type, false, e);

  assertEquals(1, onlineCount);
  assertEquals(1, offlineCount);

  oh.dispose();

  // Test for browsers that fire network events on window.
  stubs.set(goog.events.BrowserFeature,
      'HTML5_NETWORK_EVENTS_FIRE_ON_BODY', false);

  oh = new goog.events.OnlineHandler();
  listenToEvents(oh);

  online = false;
  e = new goog.events.Event('offline');
  goog.events.fireListeners(window, e.type, false, e);

  assertEquals(0, onlineCount);
  assertEquals(1, offlineCount);

  online = true;
  e = new goog.events.Event('online');
  goog.events.fireListeners(window, e.type, false, e);

  assertEquals(1, onlineCount);
  assertEquals(1, offlineCount);

  oh.dispose();
}
