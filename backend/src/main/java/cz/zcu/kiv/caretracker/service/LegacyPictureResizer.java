package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.repository.PictureRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Resizes pictures saved before V23 once at startup, so serving a picture never writes to the database.
 * An unreadable original stays as it is (not served, the owner shows initials) and is tried again on the next start.
 */
@Component
public class LegacyPictureResizer {

    private static final Logger log = LoggerFactory.getLogger(LegacyPictureResizer.class);

    private final PictureRepository pictureRepository;
    private final PictureService pictureService;

    public LegacyPictureResizer(PictureRepository pictureRepository, PictureService pictureService) {
        this.pictureRepository = pictureRepository;
        this.pictureService = pictureService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void resizeAll() {
        for (Long pictureId : pictureRepository.findIdsWithoutThumbnail()) {
            try {
                pictureService.resizeLegacyPicture(pictureId);
                log.info("Picture {} saved before resizing converted", pictureId);
            } catch (RuntimeException e) {
                // one broken picture must not stop the application from starting
                log.warn("Picture {} saved before resizing cannot be converted and is not served: {}", pictureId, e.getMessage());
            }
        }
    }
}
