/// BEGIN NelderMead

// Copyright 2016, Ben Frederickson
// All rights reserved.

// Redistribution and use in source and binary forms, with or without modification,
// are permitted provided that the following conditions are met:

// * Redistributions of source code must retain the above copyright notice, this
//   list of conditions and the following disclaimer.

// * Redistributions in binary form must reproduce the above copyright notice,
//   this list of conditions and the following disclaimer in the documentation
//   and/or other materials provided with the distribution.

// * Neither the name of the author nor the names of contributors may be used to
//   endorse or promote products derived from this software without specific prior
//   written permission.

// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
// ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
// WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
// ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
// (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
// LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
// ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
// SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

//modified 2021 Tyler Bryant

function dot(a, b) {
  var ret = 0;
  for (var i = 0; i < a.length; ++i) {
    ret += a[i] * b[i];
  }
  return ret;
}

function norm2(a) {
  return Math.sqrt(dot(a, a));
}

function weightedSum(ret, w1, v1, w2, v2) {
  for (var j = 0; j < ret.length; ++j) {
    ret[j] = w1 * v1[j] + w2 * v2[j];
  }
}

function NelderMead(f, x0, parameters) {
  parameters = parameters || {};

  var maxIterations = parameters.maxIterations || x0.length * 200,
    nonZeroDelta = parameters.nonZeroDelta || 1.05,
    zeroDelta = parameters.zeroDelta || 0.001,
    minErrorDelta = parameters.minErrorDelta || 1e-6,
    minTolerance = parameters.minErrorDelta || 1e-5,
    rho = parameters.rho !== undefined ? parameters.rho : 1,
    chi = parameters.chi !== undefined ? parameters.chi : 2,
    psi = parameters.psi !== undefined ? parameters.psi : -0.5,
    sigma = parameters.sigma !== undefined ? parameters.sigma : 0.5,
    maxDiff;

  // initialize simplex.
  var N = x0.length,
    simplex = new Array(N + 1);
  simplex[0] = x0;
  simplex[0].fx = f(x0);
  simplex[0].id = 0;
  for (var i = 0; i < N; ++i) {
    var point = x0.slice();
    point[i] = point[i] ? point[i] * nonZeroDelta : zeroDelta;
    simplex[i + 1] = point;
    simplex[i + 1].fx = f(point);
    simplex[i + 1].id = i + 1;
  }

  function updateSimplex(value) {
    for (var i = 0; i < value.length; i++) {
      simplex[N][i] = value[i];
    }
    simplex[N].fx = value.fx;
  }

  var sortOrder = function (a, b) {
    return a.fx - b.fx;
  };

  var centroid = x0.slice(),
    reflected = x0.slice(),
    contracted = x0.slice(),
    expanded = x0.slice();

  for (var iteration = 0; iteration < maxIterations; ++iteration) {
    simplex.sort(sortOrder);

    if (parameters.history) {
      // copy the simplex (since later iterations will mutate) and
      // sort it to have a consistent order between iterations
      var sortedSimplex = simplex.map(function (x) {
        var state = x.slice();
        state.fx = x.fx;
        state.id = x.id;
        return state;
      });
      sortedSimplex.sort(function (a, b) {
        return a.id - b.id;
      });

      parameters.history.push({ x: simplex[0].slice(), fx: simplex[0].fx, simplex: sortedSimplex });
    }

    maxDiff = 0;
    for (i = 0; i < N; ++i) {
      maxDiff = Math.max(maxDiff, Math.abs(simplex[0][i] - simplex[1][i]));
    }

    if (Math.abs(simplex[0].fx - simplex[N].fx) < minErrorDelta && maxDiff < minTolerance) {
      break;
    }

    // compute the centroid of all but the worst point in the simplex
    for (i = 0; i < N; ++i) {
      centroid[i] = 0;
      for (var j = 0; j < N; ++j) {
        centroid[i] += simplex[j][i];
      }
      centroid[i] /= N;
    }

    // reflect the worst point past the centroid  and compute loss at reflected
    // point
    var worst = simplex[N];
    weightedSum(reflected, 1 + rho, centroid, -rho, worst);
    reflected.fx = f(reflected);

    // if the reflected point is the best seen, then possibly expand
    if (reflected.fx < simplex[0].fx) {
      weightedSum(expanded, 1 + chi, centroid, -chi, worst);
      expanded.fx = f(expanded);
      if (expanded.fx < reflected.fx) {
        updateSimplex(expanded);
      } else {
        updateSimplex(reflected);
      }
    }

    // if the reflected point is worse than the second worst, we need to
    // contract
    else if (reflected.fx >= simplex[N - 1].fx) {
      var shouldReduce = false;

      if (reflected.fx > worst.fx) {
        // do an inside contraction
        weightedSum(contracted, 1 + psi, centroid, -psi, worst);
        contracted.fx = f(contracted);
        if (contracted.fx < worst.fx) {
          updateSimplex(contracted);
        } else {
          shouldReduce = true;
        }
      } else {
        // do an outside contraction
        weightedSum(contracted, 1 - psi * rho, centroid, psi * rho, worst);
        contracted.fx = f(contracted);
        if (contracted.fx < reflected.fx) {
          updateSimplex(contracted);
        } else {
          shouldReduce = true;
        }
      }

      if (shouldReduce) {
        // if we don't contract here, we're done
        if (sigma >= 1) break;

        // do a reduction
        for (i = 1; i < simplex.length; ++i) {
          weightedSum(simplex[i], 1 - sigma, simplex[0], sigma, simplex[i]);
          simplex[i].fx = f(simplex[i]);
        }
      }
    } else {
      updateSimplex(reflected);
    }
  }

  simplex.sort(sortOrder);
  return { fx: simplex[0].fx, x: simplex[0] };
}
/// END NelderMead

let verbose = false;

const debugLog = function () {
  if (verbose) {
    console.log.apply(console, arguments);
  }
};

function Algorithm() {
  var nstrumenta;

  let inputEvents = [];
  let outputEvents = [];
  let parameters = [];
  let controls = [];

  self.pushOutputEvent = function (event) {
    outputEvents.push(event);
  };

  const run = (runSettings, postOutputEvents) => {
    if (!inputEvents) {
      console.log('empty inputEvents');
      return;
    }
    outputEvents = [];

    debugLog('algorithmWorker run started, inputEvents.length = ' + inputEvents.length);
    nstrumenta.init();
    if (runSettings?.parameters) {
      debugLog('setting params', runSettings);
      for (index in runSettings.parameters) {
        const param = runSettings.parameters[index];
        nstrumenta.setParameter(Number(index), Number(param.value));
      }
    }

    const startTime =
      runSettings?.controls?.find((control) => control.id === 'startTime')?.value ||
      Number.NEGATIVE_INFINITY;
    const endTime =
      runSettings?.controls?.find((control) => control.id === 'endTime')?.value ||
      Number.POSITIVE_INFINITY;

    debugLog('startTime:', startTime, ' endTime:', endTime);
    inputEvents
      .filter((event) => event.timestamp >= startTime && event.timestamp <= endTime)
      .forEach((event) => {
        //check for NaN values
        let values = [];
        for (i = 0; i < 9; i++) {
          values[i] = event.values[i];
          if (isNaN(values[i]) || values[i] === null) {
            values[i] = 0;
          }
        }
        nstrumenta.reportEvent(
          event.timestamp,
          event.id,
          values.length,
          values[0],
          values[1],
          values[2],
          values[3],
          values[4],
          values[5],
          values[6],
          values[7],
          values[8]
        );
      });

    debugLog('algorithmWorker run complete, outputEvents.length = ' + outputEvents.length);
    self.postMessage({
      type: 'runComplete',
      payload: postOutputEvents ? outputEvents : undefined,
    });
  };

  const runForFmin = (fminParams, x) => {
    debugLog('runForFmin', fminParams, x);
    for (var i = 0; i < fminParams.length; i++) {
      parameters[fminParams[i]].value = x[i];
    }
    run({ parameters, controls }, false);
    return this.lossFunction(outputEvents);
  };

  const optimize = (matchStrings, options) => {
    const fminParams = [];
    const x0 = [];
    for (const index in parameters) {
      var param = parameters[index];
      matchStrings.forEach((matchString) => {
        if (param.id.includes(matchString)) {
          fminParams.push(Number(index));
          x0.push(parameters[index].value);
        }
      });
    }
    console.log('optimizing ', fminParams.map((i) => parameters[i].id).join(','));
    debugLog(fminParams);
    const tick = Date.now();
    this.lossFunction = options?.lossFunction
      ? options.lossFunction
      : (events) => {
          var error = null;
          events.forEach((event) => {
            if (event.id == 1010) {
              error += Math.abs(event.values[1]);
            }
          });
          console.log(error);
          return error;
        };
    NelderMead(
      (x) => {
        return runForFmin(fminParams, x);
      },
      x0,
      {
        maxIterations: options?.nelderMeadIterations || 3,
        nonZeroDelta: 1 + 5 * Math.pow(10, options?.nelderMeadDeltaExponent || -1),
        zeroDelta: 1 * Math.pow(10, options?.nelderMeadDeltaExponent || -1),
        minErrorDelta: 1e-6,
        maxErrorDelta: 1e-5,
        rho: 1,
        chi: 2,
        psi: -0.5,
        sigma: 0.5,
      }
    );
    console.log('completed optimization in ', 1e-3 * (Date.now() - tick), ' seconds');
    self.postMessage({
      type: 'optimizeComplete',
      parameters,
    });
  };

  self.onmessage = function (e) {
    debugLog('message from parent to algorithmworker', e.data.type);
    switch (e.data.type) {
      case 'inputEvents':
        inputEvents = e.data.payload;
        break;
      case 'loadAlgorithm':
        importScripts(e.data.payload.url);
        console.log('loaded Algorithm');
        nstrumenta = new Module.Nstrumenta();
        break;

      case 'setParameters':
        parameters = e.data.payload;
        break;

      case 'setControls':
        controls = e.data.payload;
        break;

      case 'run':
        run(e.data.runSettings, true);
        break;

      case 'optimize':
        const matchStrings = e.data.matchStrings;
        optimize(matchStrings, {
          nelderMeadIterations: e.data.maxIterations || 3,
        });
        break;
    }
  };
}

algorithmWorker = new Algorithm();

const SensorEvent = function (timestamp, id, values) {
  this.timestamp = timestamp;
  this.id = id;
  this.values = values;
};

const eventFromMsg = function (msg) {
  return new SensorEvent(msg.timestamp, msg.id, msg.values);
};

//this method is called from nstrumenta
function outputEventMsg(msg) {
  const event = eventFromMsg(msg);
  self.pushOutputEvent(event);
}
