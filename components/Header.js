"use client"
import Link from "next/link"
import { useState } from "react"
import classes from "./Header.module.css"

export default function Header(){
    const [menuOpen, setMenuOpen] = useState(false);

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    return <header className={classes.header}>
            <nav className={classes.nav}>
                <div className={classes.logo}>Clari.<span className={classes.greentext}>ty</span></div>
                
                {/* Hamburger Menu Button */}
                <button 
                    className={classes.hamburger} 
                    onClick={toggleMenu}
                    aria-label="Toggle menu"
                >
                    <span className={menuOpen ? classes.open : ''}></span>
                    <span className={menuOpen ? classes.open : ''}></span>
                    <span className={menuOpen ? classes.open : ''}></span>
                </button>

                <ul className={`${classes.navlinks} ${menuOpen ? classes.active : ''}`}>
                    <li><Link href="/" className={classes.home} onClick={() => setMenuOpen(false)}>home</Link></li>
                    <li><Link href="#contact" onClick={() => setMenuOpen(false)}>Contact</Link></li>
                    <li><Link href="/dashboard" className={classes.getstarted} onClick={() => setMenuOpen(false)}></Link></li>
                </ul>
            </nav>
        </header>
}