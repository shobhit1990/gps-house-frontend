import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { addDeviceFields } from "@/interfaces/AddDeviceFields";
import type { Device } from "@/interfaces/AddDevice";
import { SimOperator } from "@/enums/SimOperator";
import { apiErrorMessage } from "@/lib/apiErrorMessage";
import {
    useCreateDeviceMutation,
    useLazyGetDeviceByIdQuery,
    useUpdateDeviceMutation,
} from "@/store/services/api/AddDevice";
import { useGetClientMasterQuery, useGetDeviceTypeMasterQuery } from "@/store/services/api/Master";
import { buildDevicePayload } from "@/components/VehicleForm/vehiclePayloads";

type AddDeviceDialogProps = {
    isDark: boolean;
    onClose: () => void;
    onSaved: (externalId: string) => void;
    /** When set, dialog opens in edit mode and loads `/device/getById/:id`. */
    deviceId?: string;
};

const emptyValues = (): Record<string, string> => ({
    ...Object.fromEntries(
        addDeviceFields.map((field) => [
            field.name,
            field.name === "simOperator" || field.name === "secondarySimOperator"
                ? SimOperator.AIRTEL_GPRS
                : field.type === "checkbox"
                    ? "false"
                    : "",
        ]),
    ),
    active: "true",
    reason: "",
});

const refId = (value: unknown): string => {
    if (typeof value === "string" || typeof value === "number") return String(value);
    if (value && typeof value === "object") {
        const record = value as Record<string, unknown>;
        const id = record.externalId ?? record.id;
        if (typeof id === "string" || typeof id === "number") return String(id);
    }
    return "";
};

const deviceToFormValues = (device: Device): Record<string, string> => ({
    ...emptyValues(),
    imei: device.imei ?? "",
    sim: device.simNumber ?? "",
    simOperator: device.simOperator || SimOperator.AIRTEL_GPRS,
    secondarySim: device.secondarySimNumber ?? "",
    secondarySimOperator: device.secondarySimOperator || SimOperator.AIRTEL_GPRS,
    deviceType: refId(device.deviceType),
    deviceClient: refId(device.client),
    devicePassword: device.password ?? "",
    active: String(device.active !== false),
    reason: device.reason ?? "",
    ignitionPositive: String(device.ignitionWireConnected ?? false),
    ignitionDisconnected: String(device.ignitionWireNotConnected ?? false),
    airConditionPositive: String(device.airConditionWireConnected ?? false),
    attendance: String(device.attendance ?? false),
    timezoneSetting: String(device.timezoneSetting ?? false),
});

export function AddDeviceDialog({ isDark, onClose, onSaved, deviceId }: AddDeviceDialogProps) {
    const isEditMode = Boolean(deviceId);
    const { data: clients = [] } = useGetClientMasterQuery();
    const { data: deviceTypes = [], isLoading: deviceTypesLoading } = useGetDeviceTypeMasterQuery();
    const [createDevice, { isLoading: creatingDevice }] = useCreateDeviceMutation();
    const [updateDevice, { isLoading: updatingDevice }] = useUpdateDeviceMutation();
    const [loadDevice, { isFetching: loadingDevice }] = useLazyGetDeviceByIdQuery();
    const isSaving = creatingDevice || updatingDevice;
    const [values, setValues] = useState<Record<string, string>>(emptyValues);
    const [formError, setFormError] = useState("");

    const deviceTypeOptions = useMemo(
        () =>
            deviceTypes
                .map((item) => ({
                    id: String(item.externalId ?? item.id ?? ""),
                    name: item.deviceName ?? item.deviceTypeName ?? "",
                }))
                .filter((item) => item.id && item.name),
        [deviceTypes],
    );

    useEffect(() => {
        if (!deviceId) return;
        let cancelled = false;
        const load = async () => {
            try {
                const device = await loadDevice(deviceId).unwrap();
                if (!cancelled) setValues(deviceToFormValues(device));
            } catch (error) {
                console.error("Failed to load device.", error);
                if (!cancelled) {
                    setFormError(apiErrorMessage(error, "Could not load device details."));
                }
            }
        };
        void load();
        return () => {
            cancelled = true;
        };
    }, [deviceId, loadDevice]);

    const inputClass = `h-[37px] w-full rounded-lg border px-3 text-[12px] outline-none transition focus:ring-2 ${
        isDark
            ? "border-white/[0.09] bg-[#03091c]/70 text-white placeholder:text-slate-500 focus:border-cyan-300/35 focus:ring-cyan-300/[0.08]"
            : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-100"
    }`;

    const save = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const missing = addDeviceFields.find((field) => field.required && !values[field.name]?.trim());
        if (missing) {
            setFormError(`${missing.label} is required.`);
            return;
        }

        try {
            const body = buildDevicePayload(values);
            if (isEditMode && deviceId) {
                const saved = await updateDevice({ externalId: deviceId, body }).unwrap();
                toast.success("Device updated.");
                onSaved(saved.externalId || deviceId);
            } else {
                const saved = await createDevice(body).unwrap();
                toast.success("Device added.");
                onSaved(saved.externalId);
            }
            onClose();
        } catch (error) {
            console.error(`Failed to ${isEditMode ? "update" : "create"} device.`, error);
            setFormError(
                apiErrorMessage(error, `Could not ${isEditMode ? "update" : "create"} the device. Please try again.`),
            );
        }
    };

    return (
        <div
            className={`fixed inset-0 z-[860] flex items-center justify-center p-2 backdrop-blur-sm sm:p-4 ${isDark ? "bg-[#020718]/80" : "bg-slate-900/50"}`}
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !isSaving) onClose();
            }}
        >
            <form
                onSubmit={save}
                noValidate
                className={`flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border shadow-[0_24px_80px_rgba(0,0,0,0.5)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}
            >
                <header className={`flex h-[52px] shrink-0 items-center justify-between border-b px-5 ${isDark ? "border-white/[0.08] bg-[#08142e] text-white" : "border-slate-200 bg-white text-slate-900"}`}>
                    <div>
                        <p className={`mb-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${isDark ? "text-cyan-200/70" : "text-cyan-700"}`}>Fleet operations</p>
                        <h2 className="text-[15px] font-semibold">{isEditMode ? "Edit Device" : "Add Device"}</h2>
                    </div>
                    <button type="button" onClick={onClose} disabled={isSaving} aria-label="Close device dialog" className={`rounded-lg p-1.5 transition disabled:opacity-40 ${isDark ? "text-slate-400 hover:bg-white/[0.06] hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}>
                        <X className="h-5 w-5" />
                    </button>
                </header>

                {loadingDevice ? (
                    <div className={`flex items-center gap-2 border-b px-5 py-2.5 text-[12px] ${isDark ? "border-white/[0.08] bg-cyan-300/[0.06] text-cyan-100" : "border-slate-200 bg-cyan-50 text-cyan-800"}`}>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Loading device details...
                    </div>
                ) : null}

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
                    {formError && (
                        <p role="alert" className={`mb-4 rounded-lg border px-3 py-2 text-[12px] ${isDark ? "border-rose-400/20 bg-rose-400/[0.08] text-rose-200" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
                            {formError}
                        </p>
                    )}
                    <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
                        {addDeviceFields.filter((field) => field.type !== "checkbox").map((field) => (
                            <label key={field.name} className="block min-w-0">
                                <span className={`mb-1.5 block text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                                    {field.label}
                                    {field.required && <span className="ml-0.5 text-rose-400">*</span>}
                                </span>
                                {field.type === "select" ? (
                                    <select
                                        value={values[field.name] ?? ""}
                                        onChange={(event) => {
                                            setValues((current) => ({ ...current, [field.name]: event.target.value }));
                                            setFormError("");
                                        }}
                                        className={inputClass}
                                    >
                                        {field.name === "deviceType" && (
                                            <option value="">{deviceTypesLoading ? "Loading..." : "Select Device Type"}</option>
                                        )}
                                        {field.name === "deviceClient" && <option value="">Select Client</option>}
                                        {(field.name === "deviceClient"
                                            ? clients.map((client) => ({ id: client.id, name: client.name }))
                                            : field.name === "deviceType"
                                                ? deviceTypeOptions
                                                : (field.options ?? []).map((option) => ({ id: option, name: field.optionLabels?.[option] ?? option }))
                                        ).map((option) => (
                                            <option key={option.id} value={option.id}>{option.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type={field.type ?? "text"}
                                        value={values[field.name] ?? ""}
                                        placeholder={field.placeholder}
                                        maxLength={field.maxLength}
                                        onChange={(event) => {
                                            setValues((current) => ({ ...current, [field.name]: event.target.value }));
                                            setFormError("");
                                        }}
                                        className={inputClass}
                                    />
                                )}
                            </label>
                        ))}
                    </div>
                    <div className="mt-5 flex flex-col gap-3">
                        <label className={`flex items-center gap-2.5 text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                            <input
                                type="checkbox"
                                checked={values.active !== "false"}
                                onChange={(event) =>
                                    setValues((current) => ({
                                        ...current,
                                        active: String(event.target.checked),
                                        ...(event.target.checked ? { reason: "" } : {}),
                                    }))
                                }
                                className="h-4 w-4 accent-cyan-500"
                            />
                            <span className="font-semibold">Active</span>
                        </label>
                        {values.active === "false" ? (
                            <label className="block max-w-xl">
                                <span className={`mb-1.5 block text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                                    Reason <span className="font-normal text-slate-500">(Optional)</span>
                                </span>
                                <textarea
                                    value={values.reason ?? ""}
                                    onChange={(event) => {
                                        setValues((current) => ({ ...current, reason: event.target.value }));
                                        setFormError("");
                                    }}
                                    rows={3}
                                    placeholder="Why is this device inactive?"
                                    className={`${inputClass} h-auto resize-none py-2`}
                                />
                            </label>
                        ) : null}
                        {addDeviceFields.filter((field) => field.type === "checkbox").map((field) => (
                            <label key={field.name} className={`flex items-center gap-2.5 text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                                <input
                                    type="checkbox"
                                    checked={values[field.name] === "true"}
                                    onChange={(event) => setValues((current) => ({ ...current, [field.name]: String(event.target.checked) }))}
                                    className="h-4 w-4 accent-cyan-500"
                                />
                                {field.label}
                            </label>
                        ))}
                    </div>
                </div>

                <footer className={`flex shrink-0 justify-end gap-2 border-t px-5 py-3 ${isDark ? "border-white/[0.08]" : "border-slate-200"}`}>
                    <button type="button" onClick={onClose} disabled={isSaving} className={`h-9 rounded-lg border px-4 text-[12px] disabled:opacity-40 ${isDark ? "border-white/[0.10] text-slate-300" : "border-slate-200 text-slate-700"}`}>
                        Cancel
                    </button>
                    <button type="submit" disabled={isSaving || loadingDevice} className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-4 text-[12px] font-semibold disabled:opacity-60 ${isDark ? "border-cyan-300/30 bg-cyan-300/[0.14] text-cyan-50" : "border-cyan-300 bg-cyan-50 text-cyan-800"}`}>
                        {(isSaving || loadingDevice) && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        {isEditMode ? "Update Device" : "Save Device"}
                    </button>
                </footer>
            </form>
        </div>
    );
}