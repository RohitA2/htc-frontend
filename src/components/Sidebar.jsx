import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    Search,
    Building2,
    Landmark,
    Calendar,
    Receipt,
    TrendingUp,
    CreditCard,
    Truck,
    Package,
    Shredder,
    Wallet,
    Contact,
    Users,
    ChevronRight,
} from 'lucide-react';

const menuGroups = [
    {
        items: [
            { icon: Search, label: 'Search', to: '/' },
            { icon: Building2, label: 'Company', to: '/company' },
            { icon: Landmark, label: "Bank's", to: '/bank' },
            { icon: Calendar, label: 'Booking Register', to: '/booking' },
            { icon: Receipt, label: 'Bilty register', to: '/bilty-register' },
            { icon: Landmark, label: 'Banking Register', to: '/banking-register' },
            { icon: TrendingUp, label: 'Pending Banking Register', to: '/pending-banking-register' },
            { icon: CreditCard, label: 'Create Multi Payment', to: '/create-multi-payment' },
            { icon: Receipt, label: 'Multi Payment Register', to: '/multi-paymen-register' },
            { icon: Truck, label: 'STC Truck', to: '/STC-Truck' },
            { icon: Package, label: 'STC Commodity', to: '/STC-Commodity' },
            { icon: Shredder, label: 'Pending Commission', to: '/pending-commission' },
            { icon: Shredder, label: 'Pending Difference', to: '/pending-difference' },
            { icon: Shredder, label: 'Pending invoice', to: '/pending-invoice' },
            { icon: Shredder, label: 'Invoice Register', to: '/invoice-register' },
            { icon: Truck, label: 'Transporters', to: '/transporters' },
            {
                icon: Wallet,
                label: 'Commision',
                children: [
                    { label: 'Cash Register', to: '/cashVoucher' },
                    { label: 'Bank Register', to: '/bankVoucher' },
                ],
            },
            {
                icon: Wallet,
                label: 'Diffrence',
                children: [
                    { label: 'Cash Register', to: '/cashDiffrenceVoucher' },
                    { label: 'Bank Register', to: '/bankDiffrenceVoucher' },
                ],
            },
            {
                icon: Wallet,
                label: 'Commission & Difference',
                children: [
                    { label: 'Cash or Bank', to: '/commisionDifferenceLedger' },
                ],
            },
            {
                icon: Wallet,
                label: 'Party & Vendor',
                children: [
                    { label: 'Cash or Bank', to: '/bankPartyLedger' },
                ],
            },
            { icon: Receipt, label: 'Challan Register', to: '/challan' },
            { icon: Contact, label: 'Contact register', to: '/contact-register' },
            { icon: Users, label: 'User', to: '/user-register' },
        ],
    },
];

const Sidebar = () => {
    return (
        <aside className="bg-neutral-950 text-white flex flex-col w-16 hover:w-64 transition-all duration-300 ease-in-out overflow-hidden border-r border-neutral-800 shadow-2xl group">
            {/* Logo */}
            <div className="flex items-center justify-center h-16 border-b border-neutral-800">
                <img
                    src="images/Trucking-logo.jpeg"
                    alt="logo"
                    className="h-11 w-auto object-contain transition-all duration-300"
                />
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {menuGroups.map((group, index) => (
                    <React.Fragment key={index}>
                        <div key={group.name}>
                            <div className="px-8 py-2 text-xs font-semibold text-indigo-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                {group.name}
                            </div>
                            <ul className="px-3 space-y-1">
                                {group.items.map((item) => {
                                    const Icon = item.icon;
                                    // Unique key: use 'to' if exists (unique), otherwise use label (also unique in this menu)
                                    const itemKey = item.to || item.label;

                                    return (
                                        <li key={itemKey} className="group/li">
                                            {/* Parent item */}
                                            {item.to ? (
                                                <NavLink
                                                    to={item.to}
                                                    className={({ isActive }) =>
                                                        `group/item flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                                            ? 'bg-indigo-600 text-white shadow-md'
                                                            : 'hover:bg-neutral-800 hover:translate-x-1'
                                                        }`
                                                    }
                                                >
                                                    <Icon className="w-6 h-6 flex-shrink-0" />
                                                    <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                        {item.label}
                                                    </span>
                                                </NavLink>
                                            ) : (
                                                <div className="group/item flex items-center justify-between px-4 py-3 rounded-xl hover:bg-neutral-800 cursor-pointer transition-all duration-200">
                                                    <div className="flex items-center gap-4">
                                                        <Icon className="w-6 h-6 flex-shrink-0" />
                                                        <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                            {item.label}
                                                        </span>
                                                    </div>
                                                    {item.children && (
                                                        <ChevronRight className="w-5 h-5 flex-shrink-0 text-neutral-500 transition-transform duration-300 group-hover/li:rotate-90 group-hover/li:text-indigo-400" />
                                                    )}
                                                </div>
                                            )}

                                            {/* Submenu */}
                                            {item.children && (
                                                <ul className="mt-1 space-y-1 max-h-0 group-hover/li:max-h-96 opacity-0 group-hover/li:opacity-100 overflow-hidden transition-all duration-300 ease-in-out">
                                                    {item.children.map((child) => (
                                                        <li key={child.to}>
                                                            <NavLink
                                                                to={child.to}
                                                                className={({ isActive }) =>
                                                                    `flex items-center px-4 py-2.5 pl-14 rounded-xl text-sm transition-all duration-200 ${isActive
                                                                        ? 'bg-indigo-600/50 text-white font-medium'
                                                                        : 'hover:bg-neutral-800 hover:pl-16'
                                                                    }`
                                                                }
                                                            >
                                                                <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                                    • {child.label}
                                                                </span>
                                                            </NavLink>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </React.Fragment>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;