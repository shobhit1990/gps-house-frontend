import { useState, type FormEvent, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { useGetClientMasterQuery, useGetTransporterMasterQuery, useGetVehicleMasterQuery } from "@/store/services/api/Master";

type AddRaisedTicketProps = {
  isDark: boolean;
  onClose: () => void;
  onSubmit: () => void;
};

const ticketTypes = ["Bug", "Feature Request", "General Inquiry", "Service Request"];

export function AddRaisedTicket({ isDark, onClose, onSubmit }: AddRaisedTicketProps) {
  const { data: clients = [], isLoading: clientsLoading, isError: clientsError } = useGetClientMasterQuery();
  const { data: transporters = [], isLoading: transportersLoading, isError: transportersError } = useGetTransporterMasterQuery();
  const { data: vehicles = [], isLoading: vehiclesLoading, isError: vehiclesError } = useGetVehicleMasterQuery();
  const [ticketType, setTicketType] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");

  const inputClass = `h-11 w-full rounded-lg border px-3 text-sm outline-none transition focus:ring-2 ${
    isDark
      ? "border-white/[0.09] bg-[#03091c]/70 text-white placeholder:text-slate-500 focus:border-cyan-300/35 focus:ring-cyan-300/[0.08] [color-scheme:dark]"
      : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-100 [color-scheme:light]"
  }`;

  const labelClass = `mb-1.5 block text-sm font-medium ${isDark ? "text-slate-200" : "text-slate-700"}`;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!ticketType || !description.trim()) {
      setFormError("Select a ticket type and describe the issue.");
      return;
    }
    onSubmit();
  };

  const closeOnEscape = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-[800] flex items-center justify-center overflow-y-auto p-3 backdrop-blur-sm sm:p-6 ${isDark ? "bg-[#020718]/80" : "bg-slate-900/50"}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={closeOnEscape}
    >
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="raised-ticket-title"
        className={`relative my-auto w-full max-w-[1100px] overflow-hidden rounded-2xl border shadow-[0_24px_80px_rgba(0,0,0,0.35)] ${
          isDark ? "border-white/[0.10] bg-gradient-to-br from-[#0b1835] via-[#08142e] to-[#10102d]" : "border-slate-200 bg-white"
        }`}
      >
        <header className={`flex items-center justify-between border-b px-5 py-4 sm:px-7 ${isDark ? "border-white/[0.08] bg-[#08142e]/80" : "border-slate-200 bg-white"}`}>
          <div>
            <p className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${isDark ? "text-cyan-200/70" : "text-cyan-700"}`}>Support</p>
            <h2 id="raised-ticket-title" className={`mt-1 text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Raise a Ticket</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className={`rounded-lg p-2 transition ${isDark ? "text-slate-400 hover:bg-white/[0.06] hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="grid gap-x-6 gap-y-5 px-5 py-6 sm:grid-cols-2 sm:px-7 lg:grid-cols-4">
          <label>
            <span className={labelClass}>Client <span className="font-normal text-slate-500">(Optional)</span></span>
            <select className={inputClass} defaultValue="">
              <option value="">Select Client</option>
              {clientsLoading ? <option disabled>Loading clients...</option> : null}
              {clientsError ? <option disabled>Could not load clients</option> : null}
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className={labelClass}>Transporter <span className="font-normal text-slate-500">(Optional)</span></span>
            <select className={inputClass} defaultValue="">
              <option value="">Select Transporter</option>
              {transportersLoading ? <option disabled>Loading transporters...</option> : null}
              {transportersError ? <option disabled>Could not load transporters</option> : null}
              {transporters.map((transporter) => (
                <option key={transporter.id} value={transporter.id}>
                  {transporter.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className={labelClass}>Vehicle <span className="font-normal text-slate-500">(Optional)</span></span>
            <select className={inputClass} defaultValue="">
              <option value="">Select Vehicle</option>
              {vehiclesLoading ? <option disabled>Loading vehicles...</option> : null}
              {vehiclesError ? <option disabled>Could not load vehicles</option> : null}
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className={labelClass}>Ticket Type <span className="text-rose-500">*</span></span>
            <select
              value={ticketType}
              onChange={(event) => {
                setTicketType(event.target.value);
                setFormError("");
              }}
              aria-invalid={Boolean(formError && !ticketType)}
              className={inputClass}
            >
              <option value="">Select</option>
              {ticketTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>

          <label className="sm:col-span-2 lg:col-span-2">
            <span className={labelClass}>Description <span className="text-rose-500">*</span></span>
            <textarea
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                setFormError("");
              }}
              aria-invalid={Boolean(formError && !description.trim())}
              rows={5}
              placeholder="Describe your issue..."
              className={`w-full resize-y rounded-lg border px-3 py-3 text-sm outline-none transition focus:ring-2 ${
                isDark
                  ? "border-white/[0.09] bg-[#03091c]/70 text-white placeholder:text-slate-500 focus:border-cyan-300/35 focus:ring-cyan-300/[0.08]"
                  : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-100"
              }`}
            />
            {formError ? <span role="alert" className={`mt-1 block text-xs ${isDark ? "text-rose-300" : "text-rose-600"}`}>{formError}</span> : null}
          </label>
        </div>

        <footer className={`flex justify-end border-t px-5 py-4 sm:px-7 ${isDark ? "border-white/[0.08] bg-[#08142e]/70" : "border-slate-200 bg-slate-50/70"}`}>
          <button
            type="submit"
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-5 text-sm font-semibold transition ${
              isDark ? "border-cyan-300/35 bg-cyan-300/[0.16] text-cyan-50 hover:bg-cyan-300/[0.24]" : "border-cyan-300 bg-cyan-50 text-cyan-800 hover:bg-cyan-100"
            }`}
          >
            Raise Ticket
          </button>
        </footer>
      </form>
    </div>
  );
}