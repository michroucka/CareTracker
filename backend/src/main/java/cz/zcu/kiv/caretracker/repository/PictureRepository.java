package cz.zcu.kiv.caretracker.repository;

import cz.zcu.kiv.caretracker.entity.Picture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/** Picture sizes are read as single columns, so a thumbnail request does not load the detail image. */
@Repository
public interface PictureRepository extends JpaRepository<Picture, Long> {

    @Query("SELECT p.thumbnail FROM Picture p WHERE p.id = :id")
    Optional<byte[]> findThumbnailById(@Param("id") Long id);

    /** Empty for a picture saved before resizing that could not be converted: its {@code data} still holds the original upload. */
    @Query("SELECT p.data FROM Picture p WHERE p.id = :id AND p.thumbnail IS NOT NULL")
    Optional<byte[]> findResizedDataById(@Param("id") Long id);

    @Query("SELECT p.id FROM Picture p WHERE p.thumbnail IS NULL")
    List<Long> findIdsWithoutThumbnail();
}
