package cz.zcu.kiv.caretracker.repository;

import cz.zcu.kiv.caretracker.entity.Picture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PictureRepository extends JpaRepository<Picture, Long> {
}
