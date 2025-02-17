/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * vim: sw=2 ts=2 et lcs=trail\:.,tab\:>~ :
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * What this is aimed to test:
 *
 * Session annotations should be expired when browsing session ends.
 */

var as = Cc["@mozilla.org/browser/annotation-service;1"].
         getService(Ci.nsIAnnotationService);

add_task(async function test_annos_expire_session() {
  // Set interval to a large value so we don't expire on it.
  setInterval(3600); // 1h

  // Add some visited page and a couple session annotations for each.
  let now = Date.now() * 1000;
  for (let i = 0; i < 10; i++) {
    let pageURI = uri("http://session_page_anno." + i + ".mozilla.org/");
    await PlacesTestUtils.addVisits({ uri: pageURI, visitDate: now++ });
    as.setPageAnnotation(pageURI, "test1", "test", 0, as.EXPIRE_SESSION);
    as.setPageAnnotation(pageURI, "test2", "test", 0, as.EXPIRE_SESSION);
  }

  // Add some bookmarked page and a couple session annotations for each.
  for (let i = 0; i < 10; i++) {
    let pageURI = uri("http://session_item_anno." + i + ".mozilla.org/");
    let bm = await PlacesUtils.bookmarks.insert({
      parentGuid: PlacesUtils.bookmarks.unfiledGuid,
      url: pageURI,
      title: null
    });
    let id = await PlacesUtils.promiseItemId(bm.guid);
    as.setItemAnnotation(id, "test1", "test", 0, as.EXPIRE_SESSION);
    as.setItemAnnotation(id, "test2", "test", 0, as.EXPIRE_SESSION);
  }


  let pages = await getPagesWithAnnotation("test1");
  Assert.equal(pages.length, 10);
  pages = await getPagesWithAnnotation("test2");
  Assert.equal(pages.length, 10);
  let items = await getItemsWithAnnotation("test1");
  Assert.equal(items.length, 10);
  items = await getItemsWithAnnotation("test2");
  Assert.equal(items.length, 10);

  await new Promise(resolve => {
    waitForConnectionClosed(function() {
      let stmt = DBConn(true).createAsyncStatement(
        `SELECT id FROM moz_annos
         UNION ALL
         SELECT id FROM moz_items_annos
         WHERE expiration = :expiration`
      );
      stmt.params.expiration = as.EXPIRE_SESSION;
      stmt.executeAsync({
        handleResult(aResultSet) {
          dump_table("moz_annos");
          dump_table("moz_items_annos");
          do_throw("Should not find any leftover session annotations");
        },
        handleError(aError) {
          do_throw("Error code " + aError.result + " with message '" +
                   aError.message + "' returned.");
        },
        handleCompletion(aReason) {
          Assert.equal(aReason, Ci.mozIStorageStatementCallback.REASON_FINISHED);
          resolve();
        }
      });
      stmt.finalize();
    });
  });
});
