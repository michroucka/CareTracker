package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.service.PictureService;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.time.Duration;

/** Shared parts of the picture endpoints of clients, employees and the current user. */
final class PictureResponses {

    private PictureResponses() {
    }

    /**
     * JPEG response cached by the browser for a year: picture URLs carry the picture id ({@code ?v=}),
     * and a new upload gets a new id, so a cached image is never stale.
     */
    static ResponseEntity<byte[]> image(byte[] content) {
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePrivate().immutable())
                .body(content);
    }

    /** {@code ?size=thumb} for lists and avatars, anything else for the detail size. */
    static PictureService.Size size(String size) {
        return "thumb".equals(size) ? PictureService.Size.THUMB : PictureService.Size.FULL;
    }
}
