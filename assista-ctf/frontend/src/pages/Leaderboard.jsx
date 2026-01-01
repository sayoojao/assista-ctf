import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Leaderboard = () => {
    const [leaders, setLeaders] = useState([]);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/quiz/leaderboard');
                setLeaders(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchLeaderboard();
    }, []);

    return (
        <div className="max-w-2xl mx-auto mt-10">
            <h1 className="text-3xl font-bold mb-6 text-center text-neon-blue font-mono">Global_Leaderboard</h1>
            <div className="bg-cyber-gray rounded-lg shadow-xl overflow-hidden border border-gray-700">
                <table className="w-full text-left">
                    <thead className="bg-dark-bg border-b border-gray-700 text-neon-purple font-mono uppercase text-sm tracking-wider">
                        <tr>
                            <th className="p-4">Rank</th>
                            <th className="p-4">Operative</th>
                            <th className="p-4 text-right">Score</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700 font-mono">
                        {leaders.map((user, index) => (
                            <tr key={index} className="hover:bg-dark-bg/50 transition-colors">
                                <td className="p-4 text-gray-400">#{index + 1}</td>
                                <td className="p-4 font-semibold text-white">{user.username}</td>
                                <td className="p-4 text-right text-neon-blue">{user.grand_total}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Leaderboard;
