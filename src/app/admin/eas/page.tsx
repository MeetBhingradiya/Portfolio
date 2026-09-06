"use client";

import React, { useEffect, useState } from "react";

export default function AdminEAsPage() {
    const [accessList, setAccessList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState({
        userId: "",
        productId: "",
        status: "active",
        allowedDaysOfWeek: "1,2,3,4,5",
        allowedStartHour: "00:00",
        allowedEndHour: "23:59",
        timezone: "UTC",
        allowedMTIds: ""
    });

    const fetchAccess = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/ea-access");
            const json = await res.json();
            if (json.success) setAccessList(json.data || []);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchAccess();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...form,
            allowedDaysOfWeek: form.allowedDaysOfWeek.split(",").map(n => parseInt(n.trim())).filter(n => !isNaN(n)),
            allowedMTIds: form.allowedMTIds.split(",").map(s => s.trim()).filter(Boolean)
        };
        await fetch("/api/admin/ea-access", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        fetchAccess();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete access?")) return;
        await fetch(`/api/admin/ea-access?id=${id}`, { method: "DELETE" });
        fetchAccess();
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-black mb-6">EA Access Management</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Form */}
                <div className="bg-black/5 p-6 rounded-2xl border border-black/10 dark:border-white/10 dark:bg-white/5">
                    <h2 className="text-xl font-bold mb-4">Grant Access</h2>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-sm">
                        <input placeholder="User ID" required className="p-2 rounded border bg-transparent" value={form.userId} onChange={e => setForm({...form, userId: e.target.value})} />
                        <input placeholder="Product ID (from Shop)" required className="p-2 rounded border bg-transparent" value={form.productId} onChange={e => setForm({...form, productId: e.target.value})} />
                        
                        <label className="font-bold mt-2">MT Account IDs (comma-separated)</label>
                        <input placeholder="e.g. 123456, 987654" required className="p-2 rounded border bg-transparent" value={form.allowedMTIds} onChange={e => setForm({...form, allowedMTIds: e.target.value})} />
                        
                        <label className="font-bold mt-2">Allowed Days (0=Sun, 1=Mon...)</label>
                        <input placeholder="e.g. 1,2,3,4,5" className="p-2 rounded border bg-transparent" value={form.allowedDaysOfWeek} onChange={e => setForm({...form, allowedDaysOfWeek: e.target.value})} />
                        
                        <label className="font-bold mt-2">Time Schedule</label>
                        <div className="flex gap-2">
                            <input type="time" required className="p-2 rounded border bg-transparent flex-1" value={form.allowedStartHour} onChange={e => setForm({...form, allowedStartHour: e.target.value})} />
                            <input type="time" required className="p-2 rounded border bg-transparent flex-1" value={form.allowedEndHour} onChange={e => setForm({...form, allowedEndHour: e.target.value})} />
                        </div>

                        <select className="p-2 rounded border bg-transparent" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                            <option value="active">Active</option>
                            <option value="expired">Expired</option>
                            <option value="suspended">Suspended</option>
                            <option value="revoked">Revoked</option>
                        </select>

                        <button type="submit" className="mt-4 p-2 bg-blue-500 text-white rounded font-bold">Save Access</button>
                    </form>
                </div>

                {/* List */}
                <div className="md:col-span-2">
                    <h2 className="text-xl font-bold mb-4">Active Schedules</h2>
                    {loading ? <p>Loading...</p> : (
                        <div className="flex flex-col gap-3">
                            {accessList.map(a => (
                                <div key={a._id} className="p-4 rounded-xl border flex justify-between items-center bg-black/5 dark:bg-white/5">
                                    <div>
                                        <p><strong>User:</strong> {a.userId} | <strong>Product:</strong> {a.productId}</p>
                                        <p className="text-xs mt-1 text-gray-500">Days: {a.allowedDaysOfWeek?.join(", ")} | Time: {a.allowedStartHour} - {a.allowedEndHour}</p>
                                        <p className="text-xs mt-1">Status: <span className={a.status === 'active' ? 'text-green-500' : 'text-red-500'}>{a.status}</span></p>
                                    </div>
                                    <button onClick={() => handleDelete(a._id)} className="text-red-500 font-bold p-2">Delete</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
