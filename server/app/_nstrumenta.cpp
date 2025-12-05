#include <emscripten.h>
#include <emscripten/bind.h>

#include "nst_main.h"

using namespace emscripten;

class Nstrumenta
{
public:
  Nstrumenta()
  {
    algorithm_init();
  }

  void init()
  {
    algorithm_init();
  }
  
  void setArrayAtIndex(int id, int index, float value)
  {
    switch (id)
    {
    <% for (array in arrays) { %>
    case <%= array %> : 
    // <%= arrays[array].name %>
    nst_data.<%= arrays[array].id %>[index] = value;
    break;
    <% } %>    
    }
  }

  void setParameter(int id, double value)
  {
    switch (id)
    {
    <% for (param in parameters) { %>
    case <%= param %> : 
    // <%= parameters[param].name %>
    nst_data.<%= parameters[param].id %> = value;
    break;
    <% } %>
    }
  }

  int ReportEvent(double timestamp,
                  unsigned int id,
                  int values_count,
                  double msg0,
                  double msg1,
                  double msg2,
                  double msg3,
                  double msg4,
                  double msg5,
                  double msg6,
                  double msg7,
                  double msg8)
  {
    nst_event_t input_event;
    nst_event_t output_events[16];
    int output_events_count = 0;

    input_event.timestamp = timestamp;
    input_event.id = id;
    input_event.values[0] = msg0;
    input_event.values[1] = msg1;
    input_event.values[2] = msg2;
    input_event.values[3] = msg3;
    input_event.values[4] = msg4;
    input_event.values[5] = msg5;
    input_event.values[6] = msg6;
    input_event.values[7] = msg7;
    input_event.values[8] = msg8;

    algorithm_update(input_event, output_events, &output_events_count);

    if (output_events_count > 0)
    {
      for (int i = 0; i < output_events_count; i++)
      {
        EM_ASM_({
          Module.algorithmEvent = {};
          Module.algorithmEvent.timestamp = $0;
          Module.algorithmEvent.id = $1;
          Module.algorithmEvent.values = [];
        },
                output_events[i].timestamp, output_events[i].id);

        for (int j = 0; j < output_events[i].values_count; j++)
        {
          EM_ASM_({
            Module.algorithmEvent.values.push($0);
          },
                  output_events[i].values[j]);
        }
        EM_ASM_({
          outputEventMsg(Module.algorithmEvent);
        },0);
      }
    }

    return 0;
  }

private:
};

// Binding code
EMSCRIPTEN_BINDINGS(nstrumenta)
{
  class_<Nstrumenta>("Nstrumenta")
      .constructor()
      .function("init", &Nstrumenta::init)
      .function("setArrayAtIndex", &Nstrumenta::setArrayAtIndex)
      .function("setParameter", &Nstrumenta::setParameter)
      .function("reportEvent", &Nstrumenta::ReportEvent);
}