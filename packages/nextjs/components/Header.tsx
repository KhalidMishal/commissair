"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { hardhat } from "viem/chains";
import { Bars3Icon, Cog6ToothIcon, EnvelopeIcon, HomeIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useOutsideClick, useTargetNetwork } from "~~/hooks/scaffold-eth";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "Home",
    href: "/",
    icon: <HomeIcon className="h-4 w-4" />,
  },
  {
    label: "Profile",
    href: "#profile",
    icon: <UserCircleIcon className="h-4 w-4" />,
  },
  {
    label: "Contact",
    href: "#contact",
    icon: <EnvelopeIcon className="h-4 w-4" />,
  },
  {
    label: "Settings",
    href: "#settings",
    icon: <Cog6ToothIcon className="h-4 w-4" />,
  },
];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();

  return (
    <>
      {menuLinks.map(({ label, href, icon }) => {
        const isActive = pathname === href;
        return (
          <li key={href}>
            <Link
              href={href}
              passHref
              className={`${
                isActive ? "bg-primary text-primary-content shadow-[0_10px_30px_rgba(158,208,255,0.18)]" : ""
              } hover:bg-primary/10 focus:!bg-primary/10 active:!text-base-content grid grid-flow-col gap-2 rounded-lg px-3 py-2 text-sm transition-colors`}
            >
              {icon}
              <span>{label}</span>
            </Link>
          </li>
        );
      })}
    </>
  );
};

/**
 * Site header
 */
export const Header = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  const burgerMenuRef = useRef<HTMLDetailsElement>(null);
  useOutsideClick(burgerMenuRef, () => {
    burgerMenuRef?.current?.removeAttribute("open");
  });

  return (
    <div className="sticky top-0 z-20 navbar min-h-24 shrink-0 border-b border-primary/10 bg-base-200/92 px-3 shadow-lg shadow-black/20 backdrop-blur md:px-6">
      <div className="navbar-start z-10 w-auto lg:w-1/2">
        <details className="dropdown" ref={burgerMenuRef}>
          <summary className="btn btn-ghost gap-2 rounded-xl border border-primary/10 bg-base-100/80 shadow-sm hover:bg-primary/10">
            <Bars3Icon className="h-6 w-6" />
            <span className="hidden font-semibold sm:inline">Menu</span>
          </summary>
          <ul
            className="menu menu-compact dropdown-content mt-3 w-56 rounded-box border border-primary/10 bg-base-100 p-2 shadow-xl shadow-black/30"
            onClick={() => {
              burgerMenuRef?.current?.removeAttribute("open");
            }}
          >
            <HeaderMenuLinks />
          </ul>
        </details>
      </div>
      <Link
        href="/"
        passHref
        aria-label="Go to Commissair homepage"
        className="group absolute left-1/2 z-30 flex min-h-20 -translate-x-1/2 cursor-pointer items-center gap-3 rounded-box px-4 py-2 transition hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
      >
        <span className="absolute inset-0" aria-hidden="true" />
        <div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-primary/20 bg-primary/10 shadow-inner shadow-primary/10 transition group-hover:border-primary/35">
          <Image alt="Commissair logo" className="p-2" fill src="/logo.svg" />
        </div>
        <div className="relative hidden flex-col text-center sm:flex">
          <span className="text-2xl font-black leading-none tracking-normal text-primary">Commissair</span>
          <span className="mt-1 text-xs font-semibold uppercase text-base-content/55">AI commission market</span>
        </div>
      </Link>
      <div className="navbar-end z-10 grow">
        <RainbowKitCustomConnectButton />
        {isLocalNetwork && <FaucetButton />}
      </div>
    </div>
  );
};
