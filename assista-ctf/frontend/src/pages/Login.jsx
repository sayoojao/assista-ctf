import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await login(email, password);
        if (success) {
            navigate('/');
        } else {
            setError('Invalid email or password');
        }
    };

    return (
        <div className="max-w-md mx-auto mt-20 p-8 bg-cyber-gray border border-neon-blue/30 rounded-xl shadow-2xl">
            <h2 className="text-3xl font-bold mb-6 text-neon-blue font-mono text-center">System Login</h2>
            {error && <p className="text-red-400 mb-4 bg-red-900/20 p-2 rounded text-center border border-red-500/50">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block mb-2 text-gray-400 font-mono">Email_Address</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-dark-bg border border-gray-700 text-white p-3 rounded focus:border-neon-blue focus:outline-none transition-colors" required />
                </div>
                <div>
                    <label className="block mb-2 text-gray-400 font-mono">Passcode</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-dark-bg border border-gray-700 text-white p-3 rounded focus:border-neon-blue focus:outline-none transition-colors" required />
                </div>
                <button type="submit" className="w-full bg-neon-blue text-dark-bg font-bold p-3 rounded hover:bg-cyan-400 transition-colors font-mono tracking-wide">AUTHENTICATE</button>
            </form>
        </div>
    );
};

export default Login;
