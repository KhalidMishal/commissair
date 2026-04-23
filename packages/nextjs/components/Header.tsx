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
                isActive ? "bg-primary text-primary-content shadow-sm" : ""
              } hover:bg-base-300 focus:!bg-base-300 active:!text-base-content grid grid-flow-col gap-2 rounded-lg px-3 py-2 text-sm`}
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
    <div className="sticky top-0 z-20 navbar min-h-24 shrink-0 border-b border-base-300 bg-base-300/95 px-3 shadow-lg shadow-base-300/50 backdrop-blur md:px-6">
      <div className="navbar-start z-10 w-auto lg:w-1/2">
        <details className="dropdown" ref={burgerMenuRef}>
          <summary className="btn btn-ghost gap-2 rounded-xl bg-base-100/70 shadow-sm hover:bg-base-100">
            <Bars3Icon className="h-6 w-6" />
            <span className="hidden font-semibold sm:inline">Menu</span>
          </summary>
          <ul
            className="menu menu-compact dropdown-content mt-3 w-56 rounded-box border border-base-300 bg-base-100 p-2 shadow-xl"
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
        className="absolute left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-box px-4 py-2 transition hover:bg-base-200"
      >
        <div className="relative grid h-14 w-14 place-items-center rounded-2xl border border-primary/20 bg-primary/10 shadow-inner">
          <Image alt="Commissair logo" className="cursor-pointer p-2" fill src="/logo.svg" />
        </div>
        <div className="hidden flex-col text-center sm:flex">
          <span className="text-2xl font-black leading-none tracking-normal">Commissair</span>
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
