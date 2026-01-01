import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('manual'); // manual, upload, category, users
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState('');
    const [categories, setCategories] = useState([]);

    // Form states
    const [qContent, setQContent] = useState('');
    const [qCategory, setQCategory] = useState('');
    const [qDifficulty, setQDifficulty] = useState('EASY');
    const [qPoints, setQPoints] = useState(10);
    const [qOptions, setQOptions] = useState(['', '', '', '']);
    const [correctIndex, setCorrectIndex] = useState(0);
    const [allQuestions, setAllQuestions] = useState([]);

    // Edit states (Questions)
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [editCategory, setEditCategory] = useState('');
    const [editDifficulty, setEditDifficulty] = useState('');
    const [editPoints, setEditPoints] = useState(0);
    const [editOptions, setEditOptions] = useState([]);
    const [editCorrectIndex, setEditCorrectIndex] = useState(0);

    // User Management States
    const [users, setUsers] = useState([]);
    const [uUsername, setUUsername] = useState('');
    const [uEmail, setUEmail] = useState('');
    const [uPassword, setUPassword] = useState('');
    const [uRole, setURole] = useState('USER');

    // Edit User States
    const [isEditUser, setIsEditUser] = useState(false);
    const [editUserId, setEditUserId] = useState(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/questions/categories');
            setCategories(res.data);
            if (res.data.length > 0) setQCategory(res.data[0].id);
        } catch (err) {
            console.error(err);
        }
    };

    const handleFileChange = (e) => setFile(e.target.files[0]);

    const handleUpload = async (e) => {
        e.preventDefault();
        setMessage('Uploading...');
        const formData = new FormData();
        formData.append('file', file);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:5000/api/questions/upload', formData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setMessage(res.data.message);
        } catch (err) {
            setMessage('Upload failed');
        }
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            // Ensure options are valid
            const validOptions = qOptions.filter(o => o.trim() !== '');
            if (validOptions.length < 2) {
                setMessage('At least 2 options required');
                return;
            }

            await axios.post('http://localhost:5000/api/questions/create', {
                categoryId: qCategory,
                content: qContent,
                difficulty: qDifficulty,
                points: qPoints,
                options: validOptions,
                correctOptionIndex: correctIndex
            }, { headers: { 'Authorization': `Bearer ${token}` } });

            setMessage('Question created successfully!');
            // Reset form
            setQContent('');
            setQOptions(['', '', '', '']);
            setCorrectIndex(0);
        } catch (err) {
            setMessage('Creation failed');
        }
    };

    const updateOption = (idx, val) => {
        const newOpts = [...qOptions];
        newOpts[idx] = val;
        setQOptions(newOpts);
    };

    const fetchAllQuestions = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/questions', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setAllQuestions(res.data);
        } catch (err) { console.error(err); }
    };

    const handleEditClick = (q) => {
        setEditId(q.id);
        setEditContent(q.content);
        setEditCategory(q.category_id || (categories.length > 0 ? categories[0].id : ''));
        setEditDifficulty(q.difficulty);
        setEditPoints(q.points);
        setEditOptions(q.options.map(o => ({ ...o })));
        setEditCorrectIndex(0); // Default
        setIsEditing(true);
    };

    const closeEdit = () => { setIsEditing(false); setEditId(null); };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/questions/${editId}`, {
                categoryId: editCategory,
                content: editContent,
                difficulty: editDifficulty,
                points: editPoints,
                options: editOptions,
                correctOptionIndex: editCorrectIndex
            }, { headers: { 'Authorization': `Bearer ${token}` } });

            setMessage('Question updated!');
            setIsEditing(false);
            fetchAllQuestions();
        } catch (err) {
            setMessage('Update failed');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this question?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/questions/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setMessage('Question deleted.');
            fetchAllQuestions();
        } catch (err) { setMessage('Deletion failed'); }
    };

    const handleDeleteAll = async () => {
        if (!window.confirm('WARNING: THIS WILL DELETE ALL QUESTIONS AND USER RESPONSES. ARE YOU SURE?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/questions/delete-all`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setMessage('All data purged.');
            fetchAllQuestions();
        } catch (err) { setMessage('Purge failed'); }
    };

    // User Helper Functions
    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setUsers(res.data);
        } catch (err) { console.error(err); }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/users', {
                username: uUsername,
                email: uEmail,
                password: uPassword,
                role: uRole
            }, { headers: { 'Authorization': `Bearer ${token}` } });
            setMessage('User created');
            setUUsername(''); setUEmail(''); setUPassword(''); setURole('USER');
            fetchUsers();
        } catch (err) { setMessage('User creation failed'); }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Delete user?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/users/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setMessage('User deleted');
            fetchUsers();
        } catch (err) { setMessage(err.response?.data || 'Delete failed'); }
    };

    const openEditUser = (u) => {
        setEditUserId(u.id);
        setUUsername(u.username);
        setUEmail(u.email);
        setURole(u.role);
        setUPassword(''); // Blank for no change
        setIsEditUser(true);
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/users/${editUserId}`, {
                username: uUsername,
                email: uEmail,
                role: uRole,
                password: uPassword
            }, { headers: { 'Authorization': `Bearer ${token}` } });
            setMessage('User updated');
            setIsEditUser(false);
            setUUsername(''); setUEmail(''); setUPassword(''); setURole('USER');
            fetchUsers();
        } catch (err) { setMessage('Update failed'); }
    };

    const cancelEditUser = () => {
        setIsEditUser(false);
        setUUsername(''); setUEmail(''); setUPassword(''); setURole('USER');
    };

    return (
        <div className="max-w-4xl mx-auto mt-10 p-6 bg-cyber-gray border border-neon-blue/30 rounded shadow-lg text-gray-200">
            <h1 className="text-3xl font-bold mb-6 text-neon-blue font-mono">Admin_Control_Center</h1>

            <div className="flex border-b border-gray-700 mb-6 font-mono overflow-x-auto">
                <button onClick={() => setActiveTab('manual')} className={`px-4 py-2 ${activeTab === 'manual' ? 'border-b-2 border-neon-blue text-neon-blue' : 'text-gray-500 hover:text-gray-300'}`}>Manual Entry</button>
                <button onClick={() => setActiveTab('upload')} className={`px-4 py-2 ${activeTab === 'upload' ? 'border-b-2 border-neon-blue text-neon-blue' : 'text-gray-500 hover:text-gray-300'}`}>Bulk Upload (CSV)</button>
                <button onClick={() => { setActiveTab('manage'); fetchAllQuestions(); }} className={`px-4 py-2 ${activeTab === 'manage' ? 'border-b-2 border-neon-blue text-neon-blue' : 'text-gray-500 hover:text-gray-300'}`}>Manage Questions</button>
                <button onClick={() => { setActiveTab('users'); fetchUsers(); }} className={`px-4 py-2 ${activeTab === 'users' ? 'border-b-2 border-neon-blue text-neon-blue' : 'text-gray-500 hover:text-gray-300'}`}>Manage Users</button>
            </div>

            {message && <div className="mb-4 p-2 bg-blue-900/50 border border-blue-500 text-blue-200 rounded">{message}</div>}

            {/* USERS TAB */}
            {activeTab === 'users' && (
                <div className="font-mono">
                    <div className="bg-dark-bg p-4 rounded border border-gray-700 mb-6">
                        <h3 className="text-neon-purple font-bold mb-4">{isEditUser ? 'Edit User' : 'Create New User'}</h3>
                        <form onSubmit={isEditUser ? handleUpdateUser : handleCreateUser} className="grid grid-cols-2 gap-4">
                            <input placeholder="Username" className="bg-cyber-gray border border-gray-600 p-2 rounded text-white" value={uUsername} onChange={e => setUUsername(e.target.value)} required />
                            <input placeholder="Email" type="email" className="bg-cyber-gray border border-gray-600 p-2 rounded text-white" value={uEmail} onChange={e => setUEmail(e.target.value)} required />
                            <input placeholder={isEditUser ? "Password (leave blank to keep)" : "Password"} type="password" className="bg-cyber-gray border border-gray-600 p-2 rounded text-white" value={uPassword} onChange={e => setUPassword(e.target.value)} required={!isEditUser} />
                            <select className="bg-cyber-gray border border-gray-600 p-2 rounded text-white" value={uRole} onChange={e => setURole(e.target.value)}>
                                <option value="USER">USER</option>
                                <option value="ADMIN">ADMIN</option>
                            </select>
                            <div className="col-span-2 flex gap-2">
                                <button type="submit" className="flex-1 bg-neon-blue/20 text-neon-blue border border-neon-blue py-2 rounded hover:bg-neon-blue hover:text-black transition-all font-bold">
                                    {isEditUser ? 'Update User' : 'Create User'}
                                </button>
                                {isEditUser && <button type="button" onClick={cancelEditUser} className="px-4 border border-gray-500 text-gray-400 rounded hover:text-white">Cancel</button>}
                            </div>
                        </form>
                    </div>

                    <div className="grid gap-2">
                        {users.map(u => (
                            <div key={u.id} className="p-3 border border-gray-700 rounded bg-dark-bg flex justify-between items-center">
                                <div>
                                    <span className="text-neon-blue font-bold mr-2">{u.username}</span>
                                    <span className="text-gray-400 text-sm">({u.email})</span>
                                    <span className={`ml-2 text-xs px-2 py-0.5 rounded ${u.role === 'ADMIN' ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'}`}>{u.role}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => openEditUser(u)} className="text-neon-purple hover:underline text-sm">Edit</button>
                                    <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:underline text-sm ml-2">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'manage' && (
                <div>
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={handleDeleteAll}
                            className="bg-red-900/20 border border-red-500 text-red-500 px-4 py-2 rounded hover:bg-red-500 hover:text-white transition-all font-mono text-sm font-bold"
                        >
                            ⚠ PURGE ALL QUESTIONS
                        </button>
                    </div>

                    <div className="grid gap-4 max-h-[600px] overflow-y-auto pr-2">
                        {allQuestions.map(q => (
                            <div key={q.id} className="p-4 border border-gray-700 rounded bg-dark-bg flex justify-between items-center group hover:border-neon-blue transition-all">
                                <div>
                                    <div className="text-sm text-gray-400 font-mono mb-1">{q.category} // {q.difficulty} // {q.points} PTS</div>
                                    <h3 className="text-white font-bold">{q.content}</h3>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEditClick(q)}
                                        className="bg-neon-purple/20 text-neon-purple border border-neon-purple px-3 py-1 rounded hover:bg-neon-purple hover:text-white transition-all font-mono text-sm"
                                    >
                                        EDIT
                                    </button>
                                    <button
                                        onClick={() => handleDelete(q.id)}
                                        className="bg-red-900/20 text-red-500 border border-red-500 px-3 py-1 rounded hover:bg-red-500 hover:text-white transition-all font-mono text-sm"
                                    >
                                        DEL
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'manual' && (
                <form onSubmit={handleManualSubmit} className="space-y-4 font-mono">
                    <div>
                        <label className="block text-sm text-neon-purple mb-1">Question Content</label>
                        <input className="w-full bg-dark-bg border border-gray-700 p-2 rounded text-white" value={qContent} onChange={e => setQContent(e.target.value)} required />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm text-neon-purple mb-1">Category</label>
                            <select className="w-full bg-dark-bg border border-gray-700 p-2 rounded text-white" value={qCategory} onChange={e => setQCategory(e.target.value)}>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-neon-purple mb-1">Difficulty</label>
                            <select className="w-full bg-dark-bg border border-gray-700 p-2 rounded text-white" value={qDifficulty} onChange={e => setQDifficulty(e.target.value)}>
                                <option value="EASY">EASY</option>
                                <option value="MEDIUM">MEDIUM</option>
                                <option value="HARD">HARD</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-neon-purple mb-1">Points</label>
                            <input type="number" className="w-full bg-dark-bg border border-gray-700 p-2 rounded text-white" value={qPoints} onChange={e => setQPoints(e.target.value)} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-neon-purple mb-1">Options (Mark correct one)</label>
                        {qOptions.map((opt, i) => (
                            <div key={i} className="flex items-center gap-2 mb-2">
                                <input type="radio" name="correctOpt" checked={correctIndex === i} onChange={() => setCorrectIndex(i)} />
                                <input
                                    className="flex-1 bg-dark-bg border border-gray-700 p-2 rounded text-white"
                                    value={opt}
                                    onChange={e => updateOption(i, e.target.value)}
                                    placeholder={`Option ${i + 1}`}
                                    required={i < 2}
                                />
                            </div>
                        ))}
                    </div>

                    <button type="submit" className="w-full bg-neon-blue/20 border border-neon-blue text-neon-blue py-2 rounded hover:bg-neon-blue/40 transition-all font-bold">
                        &gt; Deploy Question_
                    </button>
                </form>
            )}

            {activeTab === 'upload' && (
                <div className="font-mono">
                    <form onSubmit={handleUpload} className="flex flex-col gap-4">
                        <div className="border border-dashed border-gray-600 p-8 text-center rounded">
                            <input type="file" accept=".csv" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-neon-purple file:text-white hover:file:bg-purple-700" />
                        </div>
                        <button type="submit" className="bg-neon-blue text-dark-bg font-bold py-2 px-4 rounded hover:bg-cyan-400 w-fit">Upload CSV</button>
                    </form>
                    <div className="mt-6 bg-dark-bg p-4 rounded border border-gray-700 text-sm opacity-80">
                        <h3 className="text-neon-purple font-bold mb-2">CSV Format:</h3>
                        <p>Category,Difficulty,Content,Points,Options,CorrectOption</p>
                    </div>
                </div>
            )}
            {/* Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-cyber-gray border border-neon-purple p-6 rounded-xl max-w-2xl w-full shadow-2xl relative">
                        <button onClick={closeEdit} className="absolute top-4 right-4 text-gray-500 hover:text-white text-2xl">&times;</button>
                        <h2 className="text-2xl font-bold mb-6 text-neon-purple font-mono">Edit_Question_Data</h2>

                        <form onSubmit={handleUpdateSubmit} className="space-y-4 font-mono">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Question Content</label>
                                <input className="w-full bg-dark-bg border border-gray-700 p-2 rounded text-white" value={editContent} onChange={e => setEditContent(e.target.value)} required />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <select className="bg-dark-bg border border-gray-700 p-2 rounded text-white" value={editCategory} onChange={e => setEditCategory(e.target.value)}>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <select className="bg-dark-bg border border-gray-700 p-2 rounded text-white" value={editDifficulty} onChange={e => setEditDifficulty(e.target.value)}>
                                    <option value="EASY">EASY</option>
                                    <option value="MEDIUM">MEDIUM</option>
                                    <option value="HARD">HARD</option>
                                </select>
                                <input type="number" className="bg-dark-bg border border-gray-700 p-2 rounded text-white" value={editPoints} onChange={e => setEditPoints(e.target.value)} />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Options</label>
                                {editOptions.map((opt, i) => (
                                    <div key={i} className="flex items-center gap-2 mb-2">
                                        <input type="radio" name="editCorrect" checked={editCorrectIndex === i} onChange={() => setEditCorrectIndex(i)} className="accent-neon-purple" />
                                        <input
                                            className="flex-1 bg-dark-bg border border-gray-700 p-2 rounded text-white"
                                            value={opt.content}
                                            onChange={e => {
                                                const newOpts = [...editOptions];
                                                newOpts[i].content = e.target.value;
                                                setEditOptions(newOpts);
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>

                            <button type="submit" className="w-full bg-neon-purple/20 border border-neon-purple text-neon-purple py-2 rounded hover:bg-neon-purple/40 transition-all font-bold">
                                Update Database
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
