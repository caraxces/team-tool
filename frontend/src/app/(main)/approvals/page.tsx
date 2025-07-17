'use client';
import React, { useState } from 'react';
import { Mail, Briefcase, HandCoins } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { LeaveRequestForm } from '@/components/approvals/LeaveRequestForm';
import { PaymentRequestForm } from '@/components/approvals/PaymentRequestForm';
import { RequestHistory } from '@/components/approvals/RequestHistory';

type ActiveTab = 'leave' | 'payment';

const queryClient = new QueryClient();

const ApprovalsPageContent = () => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('leave');
    const [refreshKey, setRefreshKey] = useState(0);

    const handleSuccess = () => {
        setRefreshKey(prevKey => prevKey + 1);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'leave':
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-6">Xin nghỉ phép / Ngoài văn phòng</h2>
                        <LeaveRequestForm onSuccess={handleSuccess} />
                    </div>
                );
            case 'payment':
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-6">Yêu cầu thanh toán</h2>
                        <PaymentRequestForm onSuccess={handleSuccess} />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="p-4 sm:p-6 md:p-8 text-white min-h-screen">
            <header className="mb-8">
                <h1 className="text-4xl font-bold tracking-tight">Trung tâm Phê duyệt</h1>
                <p className="text-gray-400 mt-2">Tạo và quản lý các yêu cầu nghỉ phép và thanh toán của bạn.</p>
            </header>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Left Sidebar for Tabs */}
                <aside className="w-full md:w-1/4">
                    <nav className="flex flex-col space-y-2">
                        <button
                            onClick={() => setActiveTab('leave')}
                            className={`flex items-center p-3 rounded-lg transition-all duration-300 w-full text-left border ${
                                activeTab === 'leave' 
                                ? 'bg-violet-500/20 border-violet-400/50 shadow-lg' 
                                : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/20'
                            }`}
                        >
                            <Briefcase className="mr-3 h-5 w-5" />
                            <span>Nghỉ phép / OOO</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('payment')}
                            className={`flex items-center p-3 rounded-lg transition-all duration-300 w-full text-left border ${
                                activeTab === 'payment' 
                                ? 'bg-violet-500/20 border-violet-400/50 shadow-lg' 
                                : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/20'
                            }`}
                        >
                            <HandCoins className="mr-3 h-5 w-5" />
                            <span>Thanh toán</span>
                        </button>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="w-full md:w-3/4">
                    <div className="bg-gray-800/60 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                        {renderContent()}
                    </div>
                </main>
            </div>
            
            {/* History Section */}
            <section className="mt-12">
                 <h2 className="text-3xl font-bold mb-6">Lịch sử Yêu cầu</h2>
                 <div className="bg-gray-800/60 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                    <RequestHistory refreshKey={refreshKey} />
                 </div>
            </section>
        </div>
    );
};

const ApprovalsPage = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <ApprovalsPageContent />
        </QueryClientProvider>
    );
};


export default ApprovalsPage; 