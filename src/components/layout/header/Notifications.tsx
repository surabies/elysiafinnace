"use client";

import { IconBellRinging } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import * as MessagesData from "../types/data";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const Notifications = () => {
  return (
    <div className="px-15">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Buka notifikasi"
            className="relative flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent"
          >
            <IconBellRinging size={20} />
            <span className="absolute -inset-e-1.5 -top-1.25 size-2 rounded-full bg-primary" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-screen py-6 sm:w-75"
        >
          {/* Header */}
          <div className="flex items-center px-6 justify-between">
            <h3 className="mb-0 text-heading-16">Notification</h3>
            <Badge variant="default">5 new</Badge>
          </div>
          {/* Scrollable content */}
          <SimpleBar className="max-h-80 mt-3">
            {MessagesData.Notifications.map((item) => (
              <DropdownMenuItem
                className="w-full px-6 py-3"
                key={item.title}
                asChild
              >
                <Link href="#" className="flex w-full items-center">
                  <div className="flex items-center">
                    <span className="shrink-0 relative">
                      <Image
                        src={item.avatar}
                        width={45}
                        height={45}
                        alt=""
                        className="rounded-full"
                      />
                    </span>
                    <div className="ps-4">
                      <p className="mb-1 text-label-14 font-medium">
                        {item.title}
                      </p>
                      <span className="block truncate text-label-12 text-muted-foreground">
                        {item.subtitle}
                      </span>
                    </div>
                  </div>
                </Link>
              </DropdownMenuItem>
            ))}
          </SimpleBar>
          <div className="pt-5 px-6">
            <Button variant="outline" className="w-full">
              See All Notifications
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default Notifications;
