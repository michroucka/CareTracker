package cz.zcu.kiv.caretracker.repository;

import cz.zcu.kiv.caretracker.entity.Picture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PictureRepository extends JpaRepository<Picture, Long> {
    Optional<Picture> findByClientId(Long clientId);

    @Modifying
    @Query("DELETE FROM Picture p WHERE p.client.id = :clientId")
    void deleteByClientId(@Param("clientId") Long clientId);

    boolean existsByClientId(Long clientId);
}
