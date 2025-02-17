/* -*- Mode: C++; tab-width: 8; indent-tabs-mode: nil; c-basic-offset: 4 -*-
 * vim: set ts=8 sts=4 et sw=4 tw=99:
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#ifndef js_UbiNodeUtils_h
#define js_UbiNodeUtils_h

#include "jspubtd.h"

#include "js/UbiNode.h"
#include "js/UniquePtr.h"

using JS::ubi::Edge;
using JS::ubi::EdgeRange;
using JS::ubi::EdgeVector;

namespace JS {
namespace ubi {
// An EdgeRange concrete class that simply holds a vector of Edges,
// populated by the addTracerEdges method.
class SimpleEdgeRange : public EdgeRange {
    EdgeVector edges;
    size_t i;

  protected:
    void settle() {
        front_ = i < edges.length() ? &edges[i] : nullptr;
    }

  public:
    explicit SimpleEdgeRange() : edges(), i(0) { }

    bool addTracerEdges(JSRuntime* rt, void* thing, JS::TraceKind kind, bool wantNames);

    bool addEdge(Edge edge) {
        if (!edge.name || !edges.append(std::move(edge)))
            return false;
        settle();
        return true;
    }

    void popFront() override { i++; settle(); }
};

} // namespace JS
} // namespace ubi


#endif // js_UbiNodeUtils_h
