import React from 'react';
import { AirportData, ATCMessage, FlightPhase } from '../types';
import { soundEngine } from '../simulation/audio';

interface ATCProps {
  airport: AirportData;
  flightPhase: FlightPhase;
  messages: ATCMessage[];
  onSendMessage: (text: string, isPilot: boolean, nextPhase?: FlightPhase) => void;
  onClose: () => void;
}

export const ATCCommPanel: React.FC<ATCProps> = ({
  airport,
  flightPhase,
  messages,
  onSendMessage,
  onClose,
}) => {
  const callsign = "SKYLINE 428";
  const rwy = airport.runways[0].name;

  const handleAction = (requestText: string, atcResponseText: string, nextPhase?: FlightPhase) => {
    soundEngine.playRadioSquawk();
    // 1. Pilot transmission
    onSendMessage(requestText, true);

    // 2. ATC transmission after 600ms
    setTimeout(() => {
      soundEngine.playRadioSquawk();
      onSendMessage(atcResponseText, false, nextPhase);
      soundEngine.speakCallout(atcResponseText);
    }, 700);
  };

  // Determine available options based on current flight phase
  const renderAvailableOptions = () => {
    switch (flightPhase) {
      case 'GATE_PREPARATION':
      case 'PARKED':
        return (
          <button
            onClick={() =>
              handleAction(
                `${airport.icao} Delivery, ${callsign}, requesting IFR clearance and pushback.`,
                `${callsign}, ${airport.icao} Delivery, cleared as filed. Pushback and engine start approved facing south.`,
                'PUSHBACK'
              )
            }
            className="w-full text-left p-2 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 rounded border border-neutral-700 font-bold transition-colors"
          >
            1. Request IFR Clearance & Pushback
          </button>
        );

      case 'PUSHBACK':
        return (
          <button
            onClick={() =>
              handleAction(
                `${airport.icao} Ground, ${callsign}, pushback complete, ready to taxi with Information Bravo.`,
                `${callsign}, ${airport.icao} Ground, taxi to runway ${rwy} via taxiways Alpha, Bravo. Hold short runway ${rwy}.`,
                'TAXI'
              )
            }
            className="w-full text-left p-2 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 rounded border border-neutral-700 font-bold transition-colors"
          >
            2. Request Taxi Clearance to Runway {rwy}
          </button>
        );

      case 'TAXI':
        return (
          <button
            onClick={() =>
              handleAction(
                `${airport.icao} Tower, ${callsign}, holding short runway ${rwy}, ready for departure.`,
                `${callsign}, ${airport.icao} Tower, wind 280 at 8 knots, runway ${rwy}, line up and wait.`,
                'TAKEOFF_ROLL'
              )
            }
            className="w-full text-left p-2 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 rounded border border-neutral-700 font-bold transition-colors"
          >
            3. Contact Tower: Holding Short Runway {rwy} (Line up & Wait)
          </button>
        );

      case 'TAKEOFF_ROLL':
        return (
          <button
            onClick={() =>
              handleAction(
                `${airport.icao} Tower, ${callsign}, lined up runway ${rwy}.`,
                `${callsign}, runway ${rwy}, wind 280 at 8, cleared for takeoff. Have a good flight!`,
                'CLIMB'
              )
            }
            className="w-full text-left p-2 bg-emerald-900/50 hover:bg-emerald-800/50 text-emerald-300 rounded border border-emerald-600 font-bold transition-colors"
          >
            4. Request Takeoff Clearance Runway {rwy}
          </button>
        );

      case 'CLIMB':
        return (
          <button
            onClick={() =>
              handleAction(
                `${airport.icao} Departure, ${callsign}, climbing through 4,000 for FL180.`,
                `${callsign}, radar contact. Climb and maintain FL240, proceed direct to destination.`,
                'CRUISE'
              )
            }
            className="w-full text-left p-2 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 rounded border border-neutral-700 font-bold transition-colors"
          >
            5. Contact Departure Control: Enroute Climb
          </button>
        );

      case 'CRUISE':
        return (
          <button
            onClick={() =>
              handleAction(
                `Control, ${callsign}, requesting descent profile toward destination airport.`,
                `${callsign}, descend and maintain 6,000 feet, altimeter 29.92. Expect ILS runway ${rwy}.`,
                'DESCENT'
              )
            }
            className="w-full text-left p-2 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 rounded border border-neutral-700 font-bold transition-colors"
          >
            6. Request Descent Clearance
          </button>
        );

      case 'DESCENT':
      case 'APPROACH':
        return (
          <button
            onClick={() =>
              handleAction(
                `${airport.icao} Approach, ${callsign}, established on the localizer runway ${rwy}.`,
                `${callsign}, ${airport.icao} Approach, contact Tower on 119.1. Runway ${rwy} cleared ILS approach.`,
                'FINAL_LANDING'
              )
            }
            className="w-full text-left p-2 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 rounded border border-neutral-700 font-bold transition-colors"
          >
            7. Report Inbound / Established on ILS Runway {rwy}
          </button>
        );

      case 'FINAL_LANDING':
        return (
          <button
            onClick={() =>
              handleAction(
                `${airport.icao} Tower, ${callsign}, 4 miles final runway ${rwy}.`,
                `${callsign}, wind 270 at 6, runway ${rwy}, cleared to land.`,
                'ROLLOUT'
              )
            }
            className="w-full text-left p-2 bg-emerald-900/50 hover:bg-emerald-800/50 text-emerald-300 rounded border border-emerald-600 font-bold transition-colors"
          >
            8. Request Landing Clearance Runway {rwy}
          </button>
        );

      case 'ROLLOUT':
        return (
          <button
            onClick={() =>
              handleAction(
                `${airport.icao} Ground, ${callsign}, runway vacated, taxi to gate.`,
                `${callsign}, welcome to ${airport.name}. Taxi to Gate via Echo, contact ground when parked.`,
                'TAXI_TO_GATE'
              )
            }
            className="w-full text-left p-2 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 rounded border border-neutral-700 font-bold transition-colors"
          >
            9. Vacate Runway & Request Taxi to Gate
          </button>
        );

      case 'TAXI_TO_GATE':
        return (
          <button
            onClick={() =>
              handleAction(
                `${airport.icao} Ground, ${callsign}, at the gate, engines shutting down.`,
                `${callsign}, parking brake verified. Shutdown approved, have a wonderful stay.`,
                'PARKED'
              )
            }
            className="w-full text-left p-2 bg-emerald-900/50 hover:bg-emerald-800/50 text-emerald-300 rounded border border-emerald-600 font-bold transition-colors"
          >
            10. Arrived at Gate: Complete Flight
          </button>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none">
      <div className="bg-neutral-900 border-2 border-neutral-700 rounded-xl max-w-xl w-full p-4 shadow-2xl font-mono text-xs flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-700 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-sm font-bold text-neutral-100">AIR TRAFFIC CONTROL RADIO (VHF 119.10 MHz)</span>
          </div>
          <button
            onClick={onClose}
            className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded font-bold border border-neutral-600 transition-colors"
          >
            CLOSE [X]
          </button>
        </div>

        {/* Airport Frequency Bar */}
        <div className="bg-neutral-950 px-3 py-1.5 rounded border border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
          <span>STATION: <strong className="text-white">{airport.name} ({airport.icao})</strong></span>
          <span>CALLSIGN: <strong className="text-amber-400">{callsign}</strong></span>
        </div>

        {/* Radio Transmissions History Log */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 h-52 overflow-y-auto space-y-2 flex flex-col-reverse">
          {[...messages].reverse().map((msg) => (
            <div
              key={msg.id}
              className={`p-2 rounded border text-[11px] ${
                msg.sender === 'PILOT'
                  ? 'bg-neutral-900 text-neutral-200 border-neutral-700 ml-6'
                  : 'bg-cyan-950/40 text-cyan-200 border-cyan-800/60 mr-6'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-[9px] mb-0.5 opacity-70">
                <span>{msg.sender === 'PILOT' ? callsign : `${airport.icao} ${msg.sender}`}</span>
                <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
              </div>
              <p className="leading-relaxed">{msg.text}</p>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="text-center text-neutral-500 my-auto">
              Frequency tuned to 119.10 MHz. Awaiting pilot transmission.
            </div>
          )}
        </div>

        {/* Action Transmission Options */}
        <div className="space-y-2 pt-1 border-t border-neutral-800">
          <span className="text-[10px] font-bold text-neutral-400">TRANSMIT TO ATC:</span>
          {renderAvailableOptions()}
        </div>
      </div>
    </div>
  );
};
