import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    // const [role, setRole] = useState('USER'); // Role selection disabled
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Default to USER role
        const success = await register(username, email, password, 'USER');
        if (success) {
            navigate('/login');
        } else {
            setError('Registration failed');
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-8 bg-cyber-gray border border-neon-blue/30 rounded-xl shadow-2xl">
            <h2 className="text-3xl font-bold mb-6 text-neon-blue font-mono text-center">New User Registration</h2>
            {error && <p className="text-red-400 mb-4 bg-red-900/20 p-2 rounded text-center border border-red-500/50">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block mb-1 text-gray-400 font-mono">Username</label>
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-dark-bg border border-gray-700 text-white p-2 rounded focus:border-neon-blue focus:outline-none" required />
                </div>
                <div>
                    <label className="block mb-1 text-gray-400 font-mono">Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-dark-bg border border-gray-700 text-white p-2 rounded focus:border-neon-blue focus:outline-none" required />
                </div>
                <div>
                    <label className="block mb-1 text-gray-400 font-mono">Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-dark-bg border border-gray-700 text-white p-2 rounded focus:border-neon-blue focus:outline-none" required />
                </div>
                {/* Role selection disabled to ensure single admin policy */}

                <button type="submit" className="w-full bg-neon-purple text-white font-bold p-2 rounded hover:bg-purple-600 transition-colors font-mono">REGISTER_USER</button>
            </form>
        </div>
    );
};

export default Register;
