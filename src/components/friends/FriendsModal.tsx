"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = "friends" | "search" | "requests";

export default function FriendsModal({ isOpen, onClose }: FriendsModalProps) {
  const [tab, setTab] = useState<Tab>("friends");
  const [search, setSearch] = useState("");

  const friends = useQuery(api.friends.listFriends, isOpen ? {} : "skip");
  const incoming = useQuery(api.friends.listIncoming, isOpen ? {} : "skip");
  const outgoing = useQuery(api.friends.listOutgoing, isOpen ? {} : "skip");
  const results = useQuery(
    api.friends.search,
    isOpen && search.trim().length >= 3 ? { email: search.trim() } : "skip",
  );

  const sendRequest = useMutation(api.friends.sendRequest);
  const acceptRequest = useMutation(api.friends.acceptRequest);
  const declineRequest = useMutation(api.friends.declineRequest);
  const removeFriend = useMutation(api.friends.removeFriend);

  if (!isOpen) return null;

  const requestCount = (incoming?.length ?? 0) + (outgoing?.length ?? 0);

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Friends</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
              &times;
            </button>
          </div>

          <div className="flex gap-1 border-b mb-4 text-sm">
            <TabButton active={tab === "friends"} onClick={() => setTab("friends")}>
              Friends {friends ? `(${friends.length})` : ""}
            </TabButton>
            <TabButton active={tab === "requests"} onClick={() => setTab("requests")}>
              Requests {requestCount > 0 ? `(${requestCount})` : ""}
            </TabButton>
            <TabButton active={tab === "search"} onClick={() => setTab("search")}>
              Find people
            </TabButton>
          </div>

          {tab === "friends" && (
            <div className="flex flex-col gap-2">
              {friends === undefined && <p className="text-sm text-gray-500">Loading…</p>}
              {friends && friends.length === 0 && (
                <p className="text-sm text-gray-500">No friends yet. Use “Find people” to add some.</p>
              )}
              {friends?.map((f) => (
                <div key={f._id} className="flex items-center justify-between border rounded-lg px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{f.displayName || f.email}</p>
                    {f.displayName && <p className="text-xs text-gray-500">{f.email}</p>}
                  </div>
                  <button
                    onClick={() => removeFriend({ otherUserId: f._id })}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === "requests" && (
            <div className="flex flex-col gap-3">
              <Section title="Incoming">
                {incoming === undefined && <p className="text-sm text-gray-500">Loading…</p>}
                {incoming && incoming.length === 0 && <p className="text-sm text-gray-500">No incoming requests.</p>}
                {incoming?.map((r) => (
                  <div key={r.requestId} className="flex items-center justify-between border rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{r.displayName || r.email}</p>
                      {r.displayName && <p className="text-xs text-gray-500">{r.email}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => acceptRequest({ requestId: r.requestId })}
                        className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => declineRequest({ requestId: r.requestId })}
                        className="text-xs text-gray-600 hover:underline"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </Section>
              <Section title="Outgoing">
                {outgoing === undefined && <p className="text-sm text-gray-500">Loading…</p>}
                {outgoing && outgoing.length === 0 && <p className="text-sm text-gray-500">No outgoing requests.</p>}
                {outgoing?.map((r) => (
                  <div key={r.requestId} className="flex items-center justify-between border rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{r.displayName || r.email}</p>
                      {r.displayName && <p className="text-xs text-gray-500">{r.email}</p>}
                    </div>
                    <button
                      onClick={() => declineRequest({ requestId: r.requestId })}
                      className="text-xs text-gray-600 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </Section>
            </div>
          )}

          {tab === "search" && (
            <div className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Search by email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {search.trim().length > 0 && search.trim().length < 3 && (
                <p className="text-xs text-gray-500">Type at least 3 characters.</p>
              )}
              {results !== undefined && search.trim().length >= 3 && results.length === 0 && (
                <p className="text-sm text-gray-500">No matches.</p>
              )}
              {results?.map((u) => (
                <div key={u._id} className="flex items-center justify-between border rounded-lg px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{u.displayName || u.email}</p>
                    {u.displayName && <p className="text-xs text-gray-500">{u.email}</p>}
                  </div>
                  <SearchAction
                    relation={u.relation}
                    onSend={() => sendRequest({ toUserId: u._id as Id<"users"> })}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 -mb-px border-b-2 ${
        active ? "border-blue-600 text-blue-600 font-medium" : "border-transparent text-gray-600 hover:text-gray-900"
      }`}
    >
      {children}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">{title}</p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function SearchAction({
  relation,
  onSend,
}: {
  relation: "none" | "friend" | "requested" | "incoming";
  onSend: () => void;
}) {
  if (relation === "friend")
    return <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded">Friend</span>;
  if (relation === "requested")
    return <span className="text-xs text-gray-500">Request sent</span>;
  if (relation === "incoming")
    return (
      <button onClick={onSend} className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700">
        Accept request
      </button>
    );
  return (
    <button onClick={onSend} className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700">
      Add friend
    </button>
  );
}
