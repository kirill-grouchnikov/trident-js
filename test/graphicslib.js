/*
* This is a port of BSD-licensed code from <a href="http://prefuse.org/">Prefuse</a> by
* <a href="http://hci.stanford.edu/jheer/">Jeffrey Michael Heer</a>.
*/
function GraphicsLib() {
  this.cardinalSpline = function(ctx, pts, slack, closed) {
    ctx.moveTo(pts[0], pts[1]);
    var npoints = 0;
    for (; npoints < pts.length; ++npoints) {
      if (isNaN(pts[npoints])) {
        break;
      }
    }
    this.cardinalSplineGen(ctx, pts, 0, npoints / 2, slack, closed, 0.0, 0.0);
  }

  /**
  * Create a cardinal spline, a series of cubic Bezier splines smoothly
  * connecting a set of points. Cardinal splines maintain C(1) continuity,
  * ensuring the connected spline segments form a differentiable curve,
  * ensuring at least a minimum level of smoothness.
  * 
  * @param ctx
  *            canvas context that stores the result
  * @param pts
  *            the points to interpolate with a cardinal spline
  * @param start
  *            the starting index from which to read points
  * @param npoints
  *            the number of points to consider
  * @param slack
  *            a parameter controlling the "tightness" of the spline to the
  *            control points, 0.10 is a typically suitable value
  * @param closed
  *            true if the cardinal spline should be closed (i.e. return to
  *            the starting point), false for an open curve
  * @param tx
  *            a value by which to translate the curve along the x-dimension
  * @param ty
  *            a value by which to translate the curve along the y-dimension
  */
  this.cardinalSplineGen = function(ctx, pts, start, npoints, slack, closed, tx, ty) {
    // compute the size of the path
    var len = 2 * npoints;
    var end = start + len;

    if (len < 6) {
      throw "To create spline requires at least 3 points";
    }

    var dx1, dy1, dx2, dy2;

    // compute first control point
    if (closed) {
      dx2 = pts[start + 2] - pts[end - 2];
      dy2 = pts[start + 3] - pts[end - 1];
    } else {
      dx2 = pts[start + 4] - pts[start];
      dy2 = pts[start + 5] - pts[start + 1];
    }

    // repeatedly compute next control point and append curve
    var i;
    for (i = start + 2; i < end - 2; i += 2) {
      dx1 = dx2;
      dy1 = dy2;
      dx2 = pts[i + 2] - pts[i - 2];
      dy2 = pts[i + 3] - pts[i - 1];
      ctx.bezierCurveTo(tx + pts[i - 2] + slack * dx1, ty + pts[i - 1] + slack
        * dy1, tx + pts[i] - slack * dx2, ty + pts[i + 1] - slack
        * dy2, tx + pts[i], ty + pts[i + 1]);
    }

    // compute last control point
    if (closed) {
      dx1 = dx2;
      dy1 = dy2;
      dx2 = pts[start] - pts[i - 2];
      dy2 = pts[start + 1] - pts[i - 1];
      ctx.bezierCurveTo(tx + pts[i - 2] + slack * dx1, ty + pts[i - 1] + slack
        * dy1, tx + pts[i] - slack * dx2, ty + pts[i + 1] - slack
        * dy2, tx + pts[i], ty + pts[i + 1]);

      dx1 = dx2;
      dy1 = dy2;
      dx2 = pts[start + 2] - pts[end - 2];
      dy2 = pts[start + 3] - pts[end - 1];
      ctx.bezierCurveTo(tx + pts[end - 2] + slack * dx1, ty + pts[end - 1]
        + slack * dy1, tx + pts[0] - slack * dx2, ty + pts[1]
        - slack * dy2, tx + pts[0], ty + pts[1]);
      ctx.closePath();
    } else {
      ctx.bezierCurveTo(tx + pts[i - 2] + slack * dx2, ty + pts[i - 1] + slack
        * dy2, tx + pts[i] - slack * dx2, ty + pts[i + 1] - slack
        * dy2, tx + pts[i], ty + pts[i + 1]);
    }
  }
}
