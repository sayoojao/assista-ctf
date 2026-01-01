import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);

    return (
        <nav className="bg-cyber-gray border-b border-neon-blue p-4 shadow-lg shadow-neon-blue/20">
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/" className="text-2xl font-bold text-neon-blue tracking-wider font-mono">&lt;OdooOps /&gt;</Link>
                <div className="space-x-6 font-mono">
                    <Link to="/leaderboard" className="text-gray-300 hover:text-neon-blue transition-colors">Leaderboard</Link>
                    {user ? (
                        <>
                            <Link to="/quiz" className="text-gray-300 hover:text-neon-purple transition-colors">Take Quiz</Link>
                            {user.role === 'ADMIN' && (
                                <Link to="/admin" className="text-neon-blue hover:text-white transition-colors">Admin_Panel</Link>
                            )}
                            <button onClick={logout} className="border border-red-500 text-red-500 px-3 py-1 rounded hover:bg-red-500 hover:text-white transition-all">Logout</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="text-gray-300 hover:text-white">Login</Link>
                            <Link to="/register" className="text-gray-300 hover:text-white">Register</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
