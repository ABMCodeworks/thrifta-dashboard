import React, { useEffect, useState } from "react";
import {
    collection,
    onSnapshot,
    updateDoc,
    deleteDoc,
    doc,
    addDoc,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { sendNotificationToUser } from "../utils/notifications.js";

export default function RatingReports() {
    const [reports, setReports] = useState([]);

    useEffect(() => {
        const unsub = onSnapshot(collection(db, "rating_reports"), (snap) =>
            setReports(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        );
        return unsub;
    }, []);

    const banUser = async (userId) => {
        await updateDoc(doc(db, "users", userId), { banned: true });
    };

    const sendWarning = async (userId, reason) => {
        const ok = await sendNotificationToUser({
            userId,
            title: "⚠️ Warning from Thrifta Admin",
            body: reason,
            type: "warning",
        });
        if (!ok) alert("Failed to send warning");
    };

    const deleteRating = async (ratingId) => {
        await deleteDoc(doc(db, "ratings", ratingId));
    };

    return (
        <div className="card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <th className="px-4 py-3 font-medium">Rating ID</th>
                            <th className="px-4 py-3 font-medium">Reporter</th>
                            <th className="px-4 py-3 font-medium">Reason</th>
                            <th className="px-4 py-3 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {reports.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                                    No rating reports.
                                </td>
                            </tr>
                        )}
                        {reports.map((r) => (
                            <tr key={r.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 font-mono text-xs text-slate-600">{r.ratingId}</td>
                                <td className="px-4 py-3 font-mono text-xs text-slate-600">{r.reporterUserId}</td>
                                <td className="px-4 py-3 text-slate-700">{r.reason}</td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => banUser(r.reporterUserId)}
                                            className="rounded-md bg-red-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-600"
                                        >
                                            Ban
                                        </button>
                                        <button
                                            onClick={() => sendWarning(r.reporterUserId, r.reason)}
                                            className="rounded-md bg-amber-400 px-2.5 py-1 text-xs font-medium text-amber-950 hover:bg-amber-500"
                                        >
                                            Warn
                                        </button>
                                        <button
                                            onClick={() => deleteRating(r.ratingId)}
                                            className="rounded-md bg-slate-700 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-800"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
