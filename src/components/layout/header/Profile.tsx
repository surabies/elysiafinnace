"use client";

import Image from "next/image";
import Link from "next/link";
import SimpleBar from "simplebar-react";
import * as profileData from "../types/data";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Profile = () => (
  <div className="shrink-0 ps-15">
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Buka menu profil"
          className="flex size-10 items-center justify-center rounded-full transition-colors hover:bg-accent data-[state=open]:bg-accent"
        >
          <Image
            src="/images/profile/user-1.jpg"
            alt=""
            height={35}
            width={35}
            className="rounded-full"
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-screen pb-4 pt-2 sm:w-50"
      >
        <SimpleBar>
          {profileData.profileDD.map((item) => (
            <DropdownMenuItem key={item.url} asChild>
              <Link
                href={item.url}
                className="group/link flex w-full items-center gap-3 px-4 py-2 text-label-14 transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
              >
                <item.icon className="size-5 text-muted-foreground group-hover/link:text-accent-foreground group-focus/link:text-accent-foreground" />
                <span className="text-muted-foreground group-hover/link:text-accent-foreground group-focus/link:text-accent-foreground">
                  {item.title}
                </span>
              </Link>
            </DropdownMenuItem>
          ))}
        </SimpleBar>

        <DropdownMenuSeparator className="my-2" />

        <div className="px-4">
          <Button variant="outline" asChild className="w-full">
            <Link href="/auth/login">Logout</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
);

export default Profile;
