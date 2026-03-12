import { useState, useEffect } from 'react';
import { getAllUsers, banUser, unbanUser, updateUserRole } from '../../services/api';

export default function UserTable() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getAllUsers({ page, limit: 20, search });
      setUsers(res.data.users); setTotal(res.data.total);
    } catch(e) {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, search]);

  const handleBan = async (user) => {
    const reason = prompt(`Ban reason for ${user.username}:`);
    if (reason === null) return;
    await banUser(user.id, reason);
    load();
  };

  return (
    <div className="user-table-container">
      <div className="table-toolbar">
        <input className="search-input" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
        <span className="total-count">{total} users</span>
      </div>
      {loading ? <div className="loading">Loading...</div> : (
        <table className="admin-table">
          <thead><tr><th>User</th><th>Email</th><th>Joined</th><th>Role</th><th>Status</th><th>Location</th><th>Actions</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className={u.isBanned ? 'row-banned' : ''}>
                <td><div className="user-cell"><div className="cell-avatar">{(u.displayName||u.username||'?')[0]}</div><div><div className="cell-name">{u.displayName||u.username}</div><div className="cell-sub">@{u.username}</div></div></div></td>
                <td className="cell-muted">{u.email}</td>
                <td className="cell-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td>
                  <select className="role-select" value={u.role} onChange={async e => { await updateUserRole(u.id, e.target.value); load(); }}>
                    <option value="user">User</option><option value="moderator">Moderator</option><option value="admin">Admin</option>
                  </select>
                </td>
                <td><span className={`badge ${u.isBanned?'badge-banned':u.isOnline?'badge-online':'badge-offline'}`}>{u.isBanned?'Banned':u.isOnline?'Online':'Offline'}</span></td>
                <td><span className={`badge ${u.locationSharingEnabled?'badge-location':'badge-no-location'}`}>{u.locationSharingEnabled?'📍 Sharing':'🔒 Private'}</span></td>
                <td><div className="action-btns">{u.isBanned?<button className="btn-unban" onClick={async()=>{await unbanUser(u.id);load();}}>Unban</button>:<button className="btn-ban" onClick={()=>handleBan(u)}>Ban</button>}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="pagination">
        <button disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Prev</button>
        <span>Page {page}</span>
        <button disabled={users.length<20} onClick={()=>setPage(p=>p+1)}>Next →</button>
      </div>
    </div>
  );
}
